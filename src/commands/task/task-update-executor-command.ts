/**
 * @file src/commands/task/task-update-executor-command.ts
 * @author michaeljou
 */

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@infra/db/bootstrap.js'
import { createTaskStore } from '@infra/db/task-store.js'
import { resolveGlobalDatabasePath } from '@infra/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import { resolveTaskReference } from '@/commands/task/task-reference.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@infra/project/resolve-project.js'

import type {
  TaskUpdateExecutorArgs,
  TaskUpdateExecutorContext,
  TaskUpdateExecutorDependencies,
} from '@/commands/task/task-update-executor-types.js'

/**
 * 解析任务执行器更新命令使用的默认依赖集合。
 */
function getDependencies(
  overrides: Partial<TaskUpdateExecutorDependencies> = {},
): TaskUpdateExecutorDependencies {
  return {
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskUpdateExecutor.helpDescription,
    '',
    'foxpilot task update-executor',
    'fp task update-executor',
    '--id <task-id>',
    '--external-id <external-task-id>',
    '--external-source beads',
    '--executor codex|beads|none',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 更新任务的当前责任执行器。
 *
 * 这一版只修改 `current_executor` 当前态字段，不联动运行历史。
 */
export async function runTaskUpdateExecutorCommand(
  args: TaskUpdateExecutorArgs,
  context: TaskUpdateExecutorContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task update-executor'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.executor) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'EXECUTOR_REQUIRED',
            message: messages.taskUpdateExecutor.executorRequired,
          })
        : messages.taskUpdateExecutor.executorRequired,
    }
  }

  const nextExecutor = args.executor
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
              message: messages.taskUpdateExecutor.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : `${messages.taskUpdateExecutor.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
            message: messages.taskUpdateExecutor.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : `${messages.taskUpdateExecutor.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const taskReference = resolveTaskReference({
    args,
    projectId,
    taskStore,
    messages: {
      idRequired: messages.taskUpdateExecutor.idRequired,
      taskNotFound: messages.taskUpdateExecutor.taskNotFound,
    },
  })

  if (!taskReference.ok) {
    db.close()
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: args.externalId ? 'TASK_NOT_FOUND' : 'TASK_REFERENCE_REQUIRED',
            message: args.externalId
              ? messages.taskUpdateExecutor.taskNotFound
              : messages.taskUpdateExecutor.idRequired,
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

  const existingTask = taskStore.getTaskById({
    projectId,
    taskId: taskReference.value.taskId,
  })

  if (!existingTask) {
    db.close()
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'TASK_NOT_FOUND',
            message: messages.taskUpdateExecutor.taskNotFound,
            details: {
              taskId: taskReference.value.taskId,
              externalSource: args.externalId ? (args.externalSource ?? 'beads') : null,
              externalId: args.externalId ?? null,
            },
          })
        : [
            messages.taskUpdateExecutor.taskNotFound,
            `- taskId: ${taskReference.value.taskId}`,
            ...taskReference.value.referenceLines,
          ].join('\n'),
    }
  }

  if (existingTask.current_executor === nextExecutor) {
    db.close()
    const data = {
      projectRoot: managedProject.projectRoot,
      taskId: taskReference.value.taskId,
      externalRef: args.externalId
        ? {
            externalSource: args.externalSource ?? 'beads',
            externalId: args.externalId,
          }
        : null,
      from: existingTask.current_executor,
      to: nextExecutor,
      changed: false,
    }

    return {
      exitCode: 0,
      stdout: args.json
        ? toJsonSuccessOutput(commandName, data)
        : [
            messages.taskUpdateExecutor.unchanged,
            `- projectRoot: ${managedProject.projectRoot}`,
            `- taskId: ${taskReference.value.taskId}`,
            ...taskReference.value.referenceLines,
            `- executor: ${nextExecutor}`,
          ].join('\n'),
    }
  }

  const updated = taskStore.updateTaskExecutor({
    projectId,
    taskId: taskReference.value.taskId,
    executor: nextExecutor,
    updatedAt: new Date().toISOString(),
  })

  db.close()

  if (!updated) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'TASK_NOT_FOUND',
            message: messages.taskUpdateExecutor.taskNotFound,
            details: {
              taskId: taskReference.value.taskId,
              externalSource: args.externalId ? (args.externalSource ?? 'beads') : null,
              externalId: args.externalId ?? null,
            },
          })
        : [
            messages.taskUpdateExecutor.taskNotFound,
            `- taskId: ${taskReference.value.taskId}`,
            ...taskReference.value.referenceLines,
          ].join('\n'),
    }
  }

  const data = {
    projectRoot: managedProject.projectRoot,
    taskId: taskReference.value.taskId,
    externalRef: args.externalId
      ? {
          externalSource: args.externalSource ?? 'beads',
          externalId: args.externalId,
        }
      : null,
    from: existingTask.current_executor,
    to: nextExecutor,
    changed: true,
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
      messages.taskUpdateExecutor.updated,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${taskReference.value.taskId}`,
      ...taskReference.value.referenceLines,
      `- from: ${existingTask.current_executor}`,
      `- to: ${nextExecutor}`,
    ].join('\n'),
  }
}
