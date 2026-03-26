/**
 * @file src/commands/task/task-push-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import type { CliResult } from '@/commands/init/init-types.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import { resolveTaskReference } from '@/commands/task/task-reference.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@/project/resolve-project.js'
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
    '--dry-run',
    '--path <project-root>',
  ].join('\n')
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
}): {
  repositoryRoot: string
  externalTaskId: string
  title: string
  description: string | null
  priority: 0 | 1 | 2 | 3
  status: ReturnType<typeof mapTaskStatusToBdStatus>
  repositoryPath: string
} | null {
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
 * 把当前项目中的单条 Beads 导入任务回写到其来源仓库的本地 bd 数据库。
 *
 * 第一版只处理“已经导入过的任务反向更新”：
 * - 不创建新的 bd issue；
 * - 不做批量回写；
 * - 不接真实网络 API。
 *
 * 这样可以先把本地双向协作闭环补齐，再决定是否继续往批量或远端同步扩展。
 */
export async function runTaskPushBeadsCommand(
  args: TaskPushBeadsArgs,
  context: TaskPushBeadsContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
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
        stdout: `${messages.taskPushBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
      stdout: `${messages.taskPushBeads.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
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
      stdout: taskReference.stdout,
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
      stdout: [
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
      stdout: [
        messages.taskPushBeads.notImportedTask,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
      ].join('\n'),
    }
  }

  const hasLocalBeads = await dependencies.hasLocalBeadsRepository({
    repositoryRoot: snapshot.repositoryRoot,
  })

  if (!hasLocalBeads) {
    db.close()
    return {
      exitCode: 1,
      stdout: [
        messages.taskPushBeads.repositoryNotInitialized,
        `- repository: ${snapshot.repositoryPath}`,
        `- repositoryRoot: ${snapshot.repositoryRoot}`,
      ].join('\n'),
    }
  }

  if (args.dryRun) {
    db.close()
    return {
      exitCode: 0,
      stdout: [
        messages.taskPushBeads.completed,
        `- projectRoot: ${managedProject.projectRoot}`,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
        `- repository: ${snapshot.repositoryPath}`,
        `- repositoryRoot: ${snapshot.repositoryRoot}`,
        `- title: ${snapshot.title}`,
        `- description: ${snapshot.description ?? '(empty)'}`,
        `- priority: ${snapshot.priority}`,
        `- status: ${snapshot.status}`,
        '- dryRun: true',
      ].join('\n'),
    }
  }

  try {
    await dependencies.runBdUpdate({
      repositoryRoot: snapshot.repositoryRoot,
      externalTaskId: snapshot.externalTaskId,
      title: snapshot.title,
      description: snapshot.description,
      priority: snapshot.priority,
      status: snapshot.status,
    })
  } catch (error) {
    db.close()

    return {
      exitCode: 1,
      stdout: [
        messages.taskPushBeads.pushFailed,
        `- repository: ${snapshot.repositoryPath}`,
        `- repositoryRoot: ${snapshot.repositoryRoot}`,
        `- externalId: ${snapshot.externalTaskId}`,
        error instanceof Error ? `- reason: ${error.message}` : '- reason: unknown error',
      ].join('\n'),
    }
  }

  db.close()

  return {
    exitCode: 0,
    stdout: [
      messages.taskPushBeads.completed,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${taskReference.value.taskId}`,
      ...taskReference.value.referenceLines,
      `- repository: ${snapshot.repositoryPath}`,
      `- repositoryRoot: ${snapshot.repositoryRoot}`,
      `- title: ${snapshot.title}`,
      `- description: ${snapshot.description ?? '(empty)'}`,
      `- priority: ${snapshot.priority}`,
      `- status: ${snapshot.status}`,
      '- dryRun: false',
    ].join('\n'),
  }
}
