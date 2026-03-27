/**
 * @file src/commands/task/task-push-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import { resolveTaskReference } from '@/commands/task/task-reference.js'
import {
  ProjectNotInitializedError,
  RepositoryTargetNotFoundError,
  resolveManagedProject,
  resolveRepositoryTarget,
} from '@/project/resolve-project.js'
import { buildRepositoryId } from '@/sync/beads-import-service.js'
import {
  hasLocalBeadsRepository,
  mapTaskPriorityToBdPriority,
  mapTaskStatusToBdStatus,
  runBdUpdate,
} from '@/sync/beads-bd-service.js'

import type {
  TaskPushBeadsArgs,
  TaskPushBeadsContext,
  TaskPushBeadsDependencies,
} from '@/commands/task/task-push-beads-types.js'

/**
 * 解析 Beads 回写命令的默认依赖。
 *
 * 命令层只负责项目解析、任务定位和输出组装；
 * 真正的 bd CLI 调用下沉到 sync 层，避免把外部命令细节散落在多个命令里。
 */
function getDependencies(
  overrides: Partial<TaskPushBeadsDependencies> = {},
): TaskPushBeadsDependencies {
  return {
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    hasLocalBeadsRepository,
    runBdUpdate,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskPushBeads.helpDescription,
    '',
    'foxpilot task push-beads',
    'fp task push-beads',
    '--id <task-id>',
    '--external-id <external-task-id>',
    '--external-source beads',
    '--repository <repository-selector>',
    '--all-repositories',
    '--dry-run',
    '--path <project-root>',
  ].join('\n')
}

type PushSnapshot = {
  repositoryRoot: string
  externalTaskId: string
  title: string
  description: string | null
  priority: 0 | 1 | 2 | 3
  status: ReturnType<typeof mapTaskStatusToBdStatus>
  repositoryPath: string
}

/**
 * 判断当前是否采用“单任务回写”模式。
 *
 * 当前命令支持两条入口：
 * - 单任务：`--id` / `--external-id`
 * - 批量：`--repository` / `--all-repositories`
 */
function hasSingleTaskSelector(args: TaskPushBeadsArgs): boolean {
  return Boolean(args.id?.trim() || args.externalId?.trim())
}

/**
 * 把当前任务详情折叠成可直接回写到 bd 的最小快照。
 *
 * 这里显式做一次命令层转换，而不是把 `TaskDetail` 直接传给 sync 层，
 * 原因是 sync 层不应该了解 FoxPilot 详情页结构，只应该接收回写协议需要的最小字段。
 */
function buildPushSnapshot(input: {
  projectRoot: string
  detail: ReturnType<ReturnType<typeof createTaskStore>['getTaskDetail']>
}): PushSnapshot | null {
  if (!input.detail) {
    return null
  }

  if (input.detail.task.external_source !== 'beads' || !input.detail.task.external_id) {
    return null
  }

  const repositoryTarget = input.detail.targets.find((target) => target.target_type === 'repository')
  const repositoryPath = repositoryTarget?.repository_path ?? '.'

  return {
    repositoryRoot: path.resolve(input.projectRoot, repositoryPath),
    externalTaskId: input.detail.task.external_id,
    title: input.detail.task.title,
    description: input.detail.task.description,
    priority: mapTaskPriorityToBdPriority(input.detail.task.priority),
    status: mapTaskStatusToBdStatus(input.detail.task.status),
    repositoryPath,
  }
}

/**
 * 针对一条已经折叠完成的快照执行实际回写。
 *
 * 这层把“探测本地 Beads 是否存在”和“执行 bd update”合在一起，
 * 让单任务模式与批量模式复用同一套最小回写规则。
 */
async function pushSingleSnapshot(input: {
  snapshot: PushSnapshot
  dryRun: boolean
  hasLocalBeadsRepository: TaskPushBeadsDependencies['hasLocalBeadsRepository']
  runBdUpdate: TaskPushBeadsDependencies['runBdUpdate']
}): Promise<void> {
  const hasLocalBeads = await input.hasLocalBeadsRepository({
    repositoryRoot: input.snapshot.repositoryRoot,
  })

  if (!hasLocalBeads) {
    throw new Error(`repository-not-initialized:${input.snapshot.repositoryPath}:${input.snapshot.repositoryRoot}`)
  }

  if (input.dryRun) {
    return
  }

  await input.runBdUpdate({
    repositoryRoot: input.snapshot.repositoryRoot,
    externalTaskId: input.snapshot.externalTaskId,
    title: input.snapshot.title,
    description: input.snapshot.description,
    priority: input.snapshot.priority,
    status: input.snapshot.status,
  })
}

/**
 * 加载某个项目范围内的批量回写快照。
 *
 * 这里按任务引用先拿任务 ID，再逐条取详情，目的是复用现有详情查询，
 * 避免再额外维护一套专门给回写用的宽投影 SQL。
 */
function loadRepositorySnapshots(input: {
  projectRoot: string
  projectId: string
  repositoryPath: string
  taskStore: ReturnType<typeof createTaskStore>
}): PushSnapshot[] {
  const repositoryId = buildRepositoryId(input.projectRoot, input.repositoryPath)

  return input.taskStore.listImportedTaskReferences({
    projectId: input.projectId,
    externalSource: 'beads',
    repositoryId,
  }).flatMap((reference) => {
    const detail = input.taskStore.getTaskDetail({
      projectId: input.projectId,
      taskId: reference.id,
    })
    const snapshot = buildPushSnapshot({
      projectRoot: input.projectRoot,
      detail,
    })

    return snapshot ? [snapshot] : []
  })
}

/**
 * 把当前项目中的 Beads 导入任务回写到其来源仓库的本地 bd 数据库。
 *
 * 当前命令支持三种模式：
 * - 单任务回写；
 * - 单仓库批量回写；
 * - 全仓库批量回写。
 *
 * 仍然坚持三个约束：
 * - 不创建新的 bd issue；
 * - 不接真实网络 API；
 * - 只回写标题、描述、优先级和状态。
 */
export async function runTaskPushBeadsCommand(
  args: TaskPushBeadsArgs,
  context: TaskPushBeadsContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task push-beads'
  const singleTaskMode = hasSingleTaskSelector(args)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!singleTaskMode && !args.repository?.trim() && !args.allRepositories) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'TARGET_REQUIRED',
            message: messages.taskPushBeads.targetRequired,
          })
        : messages.taskPushBeads.targetRequired,
    }
  }

  const dependencies = getDependencies(context.dependencies)

  let managedProject
  try {
    managedProject = await dependencies.resolveManagedProject({
      cwd: context.cwd,
      projectPath: args.path,
    })
  } catch (error) {
    if (error instanceof ProjectNotInitializedError) {
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskPushBeads.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : `${messages.taskPushBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  let db
  try {
    db = await dependencies.bootstrapDatabase(dbPath)
  } catch {
    return {
      exitCode: 4,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'DATABASE_BOOTSTRAP_FAILED',
            message: messages.taskPushBeads.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : `${messages.taskPushBeads.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`

  if (singleTaskMode) {
    const taskReference = resolveTaskReference({
      args,
      projectId,
      taskStore,
      messages: {
        idRequired: messages.taskPushBeads.idRequired,
        taskNotFound: messages.taskPushBeads.taskNotFound,
      },
    })

    if (!taskReference.ok) {
      db.close()
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: args.externalId ? 'TASK_NOT_FOUND' : 'TASK_REFERENCE_REQUIRED',
              message: args.externalId ? messages.taskPushBeads.taskNotFound : messages.taskPushBeads.idRequired,
              details: args.externalId
                ? {
                    externalSource: args.externalSource ?? 'beads',
                    externalId: args.externalId,
                  }
                : undefined,
            })
          : taskReference.stdout,
      }
    }

    const detail = taskStore.getTaskDetail({
      projectId,
      taskId: taskReference.value.taskId,
    })

    if (!detail) {
      db.close()
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'TASK_NOT_FOUND',
              message: messages.taskPushBeads.taskNotFound,
              details: {
                taskId: taskReference.value.taskId,
                externalSource: args.externalId ? (args.externalSource ?? 'beads') : null,
                externalId: args.externalId ?? null,
              },
            })
          : [
              messages.taskPushBeads.taskNotFound,
              `- taskId: ${taskReference.value.taskId}`,
              ...taskReference.value.referenceLines,
            ].join('\n'),
      }
    }

    const snapshot = buildPushSnapshot({
      projectRoot: managedProject.projectRoot,
      detail,
    })

    if (!snapshot) {
      db.close()
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'NOT_IMPORTED_TASK',
              message: messages.taskPushBeads.notImportedTask,
              details: {
                taskId: taskReference.value.taskId,
                externalSource: args.externalId ? (args.externalSource ?? 'beads') : null,
                externalId: args.externalId ?? null,
              },
            })
          : [
              messages.taskPushBeads.notImportedTask,
              `- taskId: ${taskReference.value.taskId}`,
              ...taskReference.value.referenceLines,
            ].join('\n'),
      }
    }

    try {
      await pushSingleSnapshot({
        snapshot,
        dryRun: args.dryRun,
        hasLocalBeadsRepository: dependencies.hasLocalBeadsRepository,
        runBdUpdate: dependencies.runBdUpdate,
      })
    } catch (error) {
      db.close()

      if (error instanceof Error && error.message.startsWith('repository-not-initialized:')) {
        return {
          exitCode: 1,
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'REPOSITORY_NOT_INITIALIZED',
                message: messages.taskPushBeads.repositoryNotInitialized,
                details: {
                  repository: snapshot.repositoryPath,
                  repositoryRoot: snapshot.repositoryRoot,
                },
              })
            : [
                messages.taskPushBeads.repositoryNotInitialized,
                `- repository: ${snapshot.repositoryPath}`,
                `- repositoryRoot: ${snapshot.repositoryRoot}`,
              ].join('\n'),
        }
      }

      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PUSH_FAILED',
              message: messages.taskPushBeads.pushFailed,
              details: {
                repository: snapshot.repositoryPath,
                repositoryRoot: snapshot.repositoryRoot,
                externalId: snapshot.externalTaskId,
                reason: error instanceof Error ? error.message : 'unknown error',
              },
            })
          : [
              messages.taskPushBeads.pushFailed,
              `- repository: ${snapshot.repositoryPath}`,
              `- repositoryRoot: ${snapshot.repositoryRoot}`,
              `- externalId: ${snapshot.externalTaskId}`,
              error instanceof Error ? `- reason: ${error.message}` : '- reason: unknown error',
            ].join('\n'),
      }
    }

    db.close()

    const data = {
      projectRoot: managedProject.projectRoot,
      mode: 'single-task' as const,
      taskId: taskReference.value.taskId,
      externalRef: {
        externalSource: 'beads' as const,
        externalId: snapshot.externalTaskId,
      },
      repositoryPath: snapshot.repositoryPath,
      repositoryRoot: snapshot.repositoryRoot,
      title: snapshot.title,
      description: snapshot.description,
      priority: snapshot.priority,
      status: snapshot.status,
      pushed: 1,
      dryRun: args.dryRun,
    }

    if (args.json) {
      return {
        exitCode: 0,
        stdout: toJsonSuccessOutput(commandName, data),
      }
    }

    return {
      exitCode: 0,
      stdout: [
        messages.taskPushBeads.completed,
        `- projectRoot: ${managedProject.projectRoot}`,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
        '- mode: single-task',
        `- repository: ${snapshot.repositoryPath}`,
        `- repositoryRoot: ${snapshot.repositoryRoot}`,
        `- title: ${snapshot.title}`,
        `- description: ${snapshot.description ?? '(empty)'}`,
        `- priority: ${snapshot.priority}`,
        `- status: ${snapshot.status}`,
        '- pushed: 1',
        `- dryRun: ${args.dryRun ? 'true' : 'false'}`,
      ].join('\n'),
    }
  }

  if (!args.allRepositories) {
    let repositoryTarget
    try {
      repositoryTarget = resolveRepositoryTarget(managedProject.projectConfig, args.repository)
    } catch (error) {
      db.close()

      if (error instanceof RepositoryTargetNotFoundError) {
        return {
          exitCode: 1,
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'REPOSITORY_NOT_FOUND',
                message: messages.taskPushBeads.repositoryNotFound,
                details: {
                  repository: error.repositorySelector,
                },
              })
            : `${messages.taskPushBeads.repositoryNotFound}\n- repository: ${error.repositorySelector}`,
        }
      }

      throw error
    }

    if (!repositoryTarget) {
      db.close()
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'TARGET_REQUIRED',
              message: messages.taskPushBeads.targetRequired,
            })
          : messages.taskPushBeads.targetRequired,
      }
    }

    const repositoryRoot = path.resolve(managedProject.projectRoot, repositoryTarget.path)
    const hasLocalBeads = await dependencies.hasLocalBeadsRepository({ repositoryRoot })

    if (!hasLocalBeads) {
      db.close()
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'REPOSITORY_NOT_INITIALIZED',
              message: messages.taskPushBeads.repositoryNotInitialized,
              details: {
                repository: repositoryTarget.path,
                repositoryRoot,
              },
            })
          : [
              messages.taskPushBeads.repositoryNotInitialized,
              `- repository: ${repositoryTarget.path}`,
              `- repositoryRoot: ${repositoryRoot}`,
            ].join('\n'),
      }
    }

    const snapshots = loadRepositorySnapshots({
      projectRoot: managedProject.projectRoot,
      projectId,
      repositoryPath: repositoryTarget.path,
      taskStore,
    })

    try {
      for (const snapshot of snapshots) {
        await pushSingleSnapshot({
          snapshot,
          dryRun: args.dryRun,
          hasLocalBeadsRepository: dependencies.hasLocalBeadsRepository,
          runBdUpdate: dependencies.runBdUpdate,
        })
      }
    } catch (error) {
      db.close()
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PUSH_FAILED',
              message: messages.taskPushBeads.pushFailed,
              details: {
                repository: repositoryTarget.path,
                repositoryRoot,
                reason: error instanceof Error ? error.message : 'unknown error',
              },
            })
          : [
              messages.taskPushBeads.pushFailed,
              `- repository: ${repositoryTarget.path}`,
              `- repositoryRoot: ${repositoryRoot}`,
              error instanceof Error ? `- reason: ${error.message}` : '- reason: unknown error',
            ].join('\n'),
      }
    }

    db.close()

    const data = {
      projectRoot: managedProject.projectRoot,
      mode: 'repository' as const,
      repositoryPath: repositoryTarget.path,
      repositoryRoot,
      pushed: snapshots.length,
      dryRun: args.dryRun,
    }

    if (args.json) {
      return {
        exitCode: 0,
        stdout: toJsonSuccessOutput(commandName, data),
      }
    }

    return {
      exitCode: 0,
      stdout: [
        messages.taskPushBeads.completed,
        `- projectRoot: ${managedProject.projectRoot}`,
        '- mode: repository',
        `- repository: ${repositoryTarget.path}`,
        `- repositoryRoot: ${repositoryRoot}`,
        `- pushed: ${snapshots.length}`,
        `- dryRun: ${args.dryRun ? 'true' : 'false'}`,
      ].join('\n'),
    }
  }

  const scannedRepositories = managedProject.projectConfig.repositories.length
  let pushedRepositories = 0
  let skippedRepositories = 0
  let pushed = 0

  try {
    for (const repository of managedProject.projectConfig.repositories) {
      const repositoryRoot = path.resolve(managedProject.projectRoot, repository.path)
      const hasLocalBeads = await dependencies.hasLocalBeadsRepository({ repositoryRoot })

      if (!hasLocalBeads) {
        skippedRepositories += 1
        continue
      }

      pushedRepositories += 1

      const snapshots = loadRepositorySnapshots({
        projectRoot: managedProject.projectRoot,
        projectId,
        repositoryPath: repository.path,
        taskStore,
      })

      for (const snapshot of snapshots) {
        await pushSingleSnapshot({
          snapshot,
          dryRun: args.dryRun,
          hasLocalBeadsRepository: dependencies.hasLocalBeadsRepository,
          runBdUpdate: dependencies.runBdUpdate,
        })
      }

      pushed += snapshots.length
    }
  } catch (error) {
    db.close()
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'PUSH_FAILED',
            message: messages.taskPushBeads.pushFailed,
            details: {
              reason: error instanceof Error ? error.message : 'unknown error',
            },
          })
        : [
            messages.taskPushBeads.pushFailed,
            error instanceof Error ? `- reason: ${error.message}` : '- reason: unknown error',
          ].join('\n'),
    }
  }

  db.close()

  const data = {
    projectRoot: managedProject.projectRoot,
    mode: 'all-repositories' as const,
    scannedRepositories,
    pushedRepositories,
    skippedRepositories,
    pushed,
    dryRun: args.dryRun,
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput(commandName, data),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskPushBeads.completed,
      `- projectRoot: ${managedProject.projectRoot}`,
      '- mode: all-repositories',
      `- scannedRepositories: ${scannedRepositories}`,
      `- pushedRepositories: ${pushedRepositories}`,
      `- skippedRepositories: ${skippedRepositories}`,
      `- pushed: ${pushed}`,
      `- dryRun: ${args.dryRun ? 'true' : 'false'}`,
    ].join('\n'),
  }
}
