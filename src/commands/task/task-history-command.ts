/**
 * @file src/commands/task/task-history-command.ts
 * @author michaeljou
 */

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import { resolveTaskReference } from '@/commands/task/task-reference.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@/project/resolve-project.js'

import type {
  TaskHistoryArgs,
  TaskHistoryContext,
  TaskHistoryDependencies,
} from '@/commands/task/task-history-types.js'

/**
 * 解析任务历史命令使用的默认依赖集合。
 *
 * 这个命令只复用现有项目定位和任务仓储能力，不新增额外持久化入口。
 */
function getDependencies(
  overrides: Partial<TaskHistoryDependencies> = {},
): TaskHistoryDependencies {
  return {
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 *
 * 历史命令同样只暴露最小输入集合：任务 ID 和可选项目路径。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskHistory.helpDescription,
    '',
    'foxpilot task history',
    'fp task history',
    '--id <task-id>',
    '--external-id <external-task-id>',
    '--external-source beads',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 加载单个任务的完整运行历史。
 *
 * 命令仍然先校验任务是否属于当前项目，再读取历史，
 * 这样可以复用现有项目隔离语义，避免 taskId 被跨项目误读。
 */
export async function runTaskHistoryCommand(
  args: TaskHistoryArgs,
  context: TaskHistoryContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task history'

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
      const stdout = `${messages.taskHistory.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskHistory.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : stdout,
      }
    }

    throw error
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  let db
  try {
    db = await dependencies.bootstrapDatabase(dbPath)
  } catch {
    const stdout = `${messages.taskHistory.dbBootstrapFailed}\n- ${dbPath}`
    return {
      exitCode: 4,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'DATABASE_BOOTSTRAP_FAILED',
            message: messages.taskHistory.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : stdout,
    }
  }
  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const taskReference = resolveTaskReference({
    args,
    projectId,
    taskStore,
    messages: {
      idRequired: messages.taskHistory.idRequired,
      taskNotFound: messages.taskHistory.taskNotFound,
    },
  })

  if (!taskReference.ok) {
    db.close()
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'TASK_REFERENCE_INVALID',
            message: messages.taskHistory.taskNotFound,
            details: {
              projectRoot: managedProject.projectRoot,
            },
          })
        : taskReference.stdout,
    }
  }

  const task = taskStore.getTaskById({
    projectId,
    taskId: taskReference.value.taskId,
  })

  if (!task) {
    db.close()
    const stdout = [
      messages.taskHistory.taskNotFound,
      `- taskId: ${taskReference.value.taskId}`,
      ...taskReference.value.referenceLines,
    ].join('\n')
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'TASK_NOT_FOUND',
            message: messages.taskHistory.taskNotFound,
            details: {
              projectRoot: managedProject.projectRoot,
              taskId: taskReference.value.taskId,
            },
          })
        : stdout,
    }
  }

  const runs = taskStore.listTaskRuns({ taskId: taskReference.value.taskId })
  db.close()

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput(commandName, {
        projectRoot: managedProject.projectRoot,
        taskId: task.id,
        title: task.title,
        externalRef: args.externalId
          ? {
              externalSource: args.externalSource ?? 'beads',
              externalId: args.externalId,
            }
          : null,
        totalRuns: runs.length,
        runs: runs.map((run) => ({
          runId: run.id,
          runType: run.run_type,
          executor: run.executor,
          status: run.status,
          summary: run.summary,
          startedAt: run.started_at,
          endedAt: run.ended_at,
        })),
      }),
    }
  }

  const runLines =
    runs.length === 0
      ? [messages.taskHistory.noRuns]
      : runs.map((run, index) => {
          const timeRange = run.ended_at
            ? `${run.started_at} -> ${run.ended_at}`
            : `${run.started_at} -> (running)`
          const summary = run.summary ? ` | ${run.summary}` : ''
          return `${index + 1}. [${run.run_type}][${run.executor}][${run.status}] ${timeRange}${summary}`
        })

  return {
    exitCode: 0,
    stdout: [
      messages.taskHistory.title,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${task.id}`,
      ...taskReference.value.referenceLines,
      `- title: ${task.title}`,
      '',
      ...runLines,
    ].join('\n'),
  }
}
