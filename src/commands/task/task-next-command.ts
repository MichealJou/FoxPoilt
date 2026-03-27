/**
 * @file src/commands/task/task-next-command.ts
 * @author michaeljou
 */

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { resolveGlobalDatabasePath } from '@infra/core/paths.js'
import { bootstrapDatabase } from '@infra/db/bootstrap.js'
import { createTaskStore } from '@infra/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@infra/project/resolve-project.js'

import type {
  TaskNextArgs,
  TaskNextContext,
  TaskNextDependencies,
} from '@/commands/task/task-next-types.js'

/**
 * 解析 `task next` 使用的默认依赖集合。
 *
 * 这条命令属于纯查询命令，不直接修改任务当前态。
 * 命令层只负责：
 * - 解析项目范围；
 * - 引导数据库；
 * - 读取 store 选出的单条候选任务；
 * - 组织面向终端的输出。
 */
function getDependencies(
  overrides: Partial<TaskNextDependencies> = {},
): TaskNextDependencies {
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
    messages.taskNext.helpDescription,
    '',
    'foxpilot task next',
    'fp task next',
    '--path <project-root>',
    '--source manual|beads_sync|scan_suggestion',
    '--executor codex|beads|none',
  ].join('\n')
}

/**
 * 选择并输出当前项目“下一条最值得先推进”的任务。
 *
 * 这条命令不是简单返回第一条任务，而是有明确偏向：
 * - 已经进入活跃链路的任务优先于普通待办；
 * - 高优先级优先于低优先级；
 * - 最近更新的任务优先于长期未触碰的并列候选。
 *
 * 这样做的目标是减少人工在任务列表里反复筛选的成本，
 * 把“我现在先做哪一条”变成一个稳定、可解释的 CLI 结果。
 */
export async function runTaskNextCommand(
  args: TaskNextArgs,
  context: TaskNextContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task next'

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
      const stdout = `${messages.taskNext.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskNext.projectNotInitialized,
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
    const stdout = `${messages.taskNext.dbBootstrapFailed}\n- ${dbPath}`
    return {
      exitCode: 4,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'DATABASE_BOOTSTRAP_FAILED',
            message: messages.taskNext.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : stdout,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const task = taskStore.getNextTask({
    projectId: `project:${managedProject.projectRoot}`,
    sourceType: args.source,
    executor: args.executor,
  })

  db.close()

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput(commandName, {
        projectRoot: managedProject.projectRoot,
        filters: {
          source: args.source ?? null,
          executor: args.executor ?? null,
        },
        item: task
          ? {
              taskId: task.id,
              title: task.title,
              description: task.description,
              source: task.source_type,
              executor: task.current_executor,
              status: task.status,
              priority: task.priority,
              taskType: task.task_type,
              externalSource: task.external_source,
              externalId: task.external_id,
              updatedAt: task.updated_at,
            }
          : null,
      }),
    }
  }

  if (!task) {
    return {
      exitCode: 0,
      stdout: [
        messages.taskNext.empty,
        `- projectRoot: ${managedProject.projectRoot}`,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskNext.title,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${task.id}`,
      `- title: ${task.title}`,
      `- source: ${task.source_type}`,
      `- executor: ${task.current_executor}`,
      `- status: ${task.status}`,
      `- priority: ${task.priority}`,
      `- taskType: ${task.task_type}`,
      ...(task.external_source ? [`- externalSource: ${task.external_source}`] : []),
      ...(task.external_id ? [`- externalId: ${task.external_id}`] : []),
      ...(task.description ? [`- description: ${task.description}`] : []),
    ].join('\n'),
  }
}
