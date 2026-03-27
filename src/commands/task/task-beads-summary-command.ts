/**
 * @file src/commands/task/task-beads-summary-command.ts
 * @author michaeljou
 */

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { resolveGlobalDatabasePath } from '@foxpilot/infra/core/paths.js'
import { bootstrapDatabase } from '@foxpilot/infra/db/bootstrap.js'
import { createTaskStore } from '@foxpilot/infra/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@foxpilot/infra/project/resolve-project.js'

import type {
  TaskBeadsSummaryArgs,
  TaskBeadsSummaryContext,
  TaskBeadsSummaryDependencies,
} from '@/commands/task/task-beads-summary-types.js'

/**
 * 解析 Beads 摘要命令使用的默认依赖集合。
 */
function getDependencies(
  overrides: Partial<TaskBeadsSummaryDependencies> = {},
): TaskBeadsSummaryDependencies {
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
    messages.taskBeadsSummary.helpDescription,
    '',
    'foxpilot task beads-summary',
    'fp task beads-summary',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 展示当前项目内 `Beads` 同步任务的聚合摘要。
 *
 * 这条命令的目标不是替代列表，而是回答一个更聚焦的问题：
 * “当前项目里从 Beads 进来的任务整体是什么情况？”
 */
export async function runTaskBeadsSummaryCommand(
  args: TaskBeadsSummaryArgs,
  context: TaskBeadsSummaryContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task beads-summary'

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
      const stdout = `${messages.taskBeadsSummary.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskBeadsSummary.projectNotInitialized,
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
    const stdout = `${messages.taskBeadsSummary.dbBootstrapFailed}\n- ${dbPath}`
    return {
      exitCode: 4,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'DATABASE_BOOTSTRAP_FAILED',
            message: messages.taskBeadsSummary.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : stdout,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const summary = taskStore.getBeadsTaskSummary({
    projectId: `project:${managedProject.projectRoot}`,
  })
  db.close()

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput(commandName, {
        projectRoot: managedProject.projectRoot,
        summary: {
          total: summary.total,
          repositories: summary.repository_count,
          todo: summary.todo_count,
          executing: summary.executing_count,
          blocked: summary.blocked_count,
          done: summary.done_count,
        },
      }),
    }
  }

  if (summary.total === 0) {
    return {
      exitCode: 0,
      stdout: [
        messages.taskBeadsSummary.empty,
        `- projectRoot: ${managedProject.projectRoot}`,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskBeadsSummary.title,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- total: ${summary.total}`,
      `- repositories: ${summary.repository_count}`,
      `- todo: ${summary.todo_count}`,
      `- executing: ${summary.executing_count}`,
      `- blocked: ${summary.blocked_count}`,
      `- done: ${summary.done_count}`,
    ].join('\n'),
  }
}
