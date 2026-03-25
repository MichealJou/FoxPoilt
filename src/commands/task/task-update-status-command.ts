/**
 * @file src/commands/task/task-update-status-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@/project/resolve-project.js'

import type {
  TaskUpdateStatusArgs,
  TaskUpdateStatusContext,
  TaskUpdateStatusDependencies,
} from '@/commands/task/task-update-status-types.js'

/**
 * 解析任务状态更新命令使用的默认依赖集合。
 *
 * 状态更新命令虽然是写操作，但仍然只做三件事：
 * - 解析项目范围；
 * - 校验目标任务是否存在；
 * - 调用 store 持久化状态。
 * 这样后续无论接入状态机校验还是 task_run 记录，都可以先落在 store 层扩展。
 */
function getDependencies(
  overrides: Partial<TaskUpdateStatusDependencies> = {},
): TaskUpdateStatusDependencies {
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
 * 这里把完整状态集合直接写进帮助页，是为了把“允许写入的状态空间”
 * 暴露给终端调用者，避免他们猜测缩写或自造状态值。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskUpdateStatus.helpDescription,
    '',
    'foxpilot task update-status',
    'fp task update-status',
    '--id <task-id>',
    '--status todo|analyzing|awaiting_plan_confirm|executing|awaiting_result_confirm|done|blocked|cancelled',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 更新当前项目范围内某个任务的持久化状态。
 *
 * MVP 阶段这里做的是“直接状态更新”：
 * - 不记录原因说明；
 * - 不记录状态流转历史；
 * - 不做复杂合法流转校验。
 *
 * 这样做不是最终形态，而是为了先把人工任务管理闭环跑通。
 * 等 `task_run` 和更严格的状态机落地后，再把这里收口成受约束的流转入口。
 */
export async function runTaskUpdateStatusCommand(
  args: TaskUpdateStatusArgs,
  context: TaskUpdateStatusContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.id?.trim()) {
    return {
      exitCode: 1,
      stdout: messages.taskUpdateStatus.idRequired,
    }
  }

  if (!args.status) {
    return {
      exitCode: 1,
      stdout: messages.taskUpdateStatus.statusRequired,
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
        stdout: `${messages.taskUpdateStatus.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  let db
  try {
    db = await dependencies.bootstrapDatabase(resolveGlobalDatabasePath(context.homeDir))
  } catch {
    return {
      exitCode: 4,
      stdout: `${messages.taskUpdateStatus.dbBootstrapFailed}\n- ${resolveGlobalDatabasePath(context.homeDir)}`,
    }
  }
  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  /**
   * 先查再写，而不是直接执行 update，有两个目的：
   * 1. 输出里要展示 from -> to，必须先拿到旧状态；
   * 2. 可以把“不存在”与“更新失败”区分开来，避免用户看到模糊错误。
   */
  const existingTask = taskStore.getTaskById({
    projectId,
    taskId: args.id.trim(),
  })

  if (!existingTask) {
    db.close()
    return {
      exitCode: 1,
      stdout: `${messages.taskUpdateStatus.taskNotFound}\n- taskId: ${args.id.trim()}`,
    }
  }

  const updated = taskStore.updateTaskStatus({
    projectId,
    taskId: args.id.trim(),
    status: args.status,
    updatedAt: new Date().toISOString(),
  })

  db.close()

  if (!updated) {
    return {
      exitCode: 1,
      stdout: `${messages.taskUpdateStatus.taskNotFound}\n- taskId: ${args.id.trim()}`,
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskUpdateStatus.updated,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${args.id.trim()}`,
      `- from: ${existingTask.status}`,
      `- to: ${args.status}`,
    ].join('\n'),
  }
}
