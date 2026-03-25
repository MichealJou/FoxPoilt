/**
 * @file src/commands/task/task-list-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@/project/resolve-project.js'

import type { TaskListArgs, TaskListContext, TaskListDependencies } from '@/commands/task/task-list-types.js'

/**
 * 解析任务列表命令使用的默认依赖集合。
 *
 * 任务列表命令本身不持有业务状态，只编排：
 * - 项目解析
 * - 数据库引导
 * - 任务查询
 * 因此通过依赖注入把 IO 与查询实现解耦，测试时可以单独替换任一环节。
 */
function getDependencies(
  overrides: Partial<TaskListDependencies> = {},
): TaskListDependencies {
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
 * 状态枚举直接展开在帮助信息里，目的是让终端用户在不查文档的情况下
 * 也能明确哪些状态是可筛选值，减少无效输入。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskList.helpDescription,
    '',
    'foxpilot task list',
    'fp task list',
    '--path <project-root>',
    '--status todo|analyzing|awaiting_plan_confirm|executing|awaiting_result_confirm|done|blocked|cancelled',
  ].join('\n')
}

/**
 * 列出当前项目任务，并支持可选状态过滤。
 *
 * 这条命令只看“任务当前态”，不会展示运行历史。
 * 这样设计是为了让 `task list` 保持轻量、稳定和可读：
 * - 人工每天最常看的就是当前待办、阻塞和已完成；
 * - 历史执行链路未来会落到 `task_run` 维度单独查询；
 * - 列表命令不应因为历史数据膨胀而变慢。
 */
export async function runTaskListCommand(
  args: TaskListArgs,
  context: TaskListContext,
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
        stdout: `${messages.taskList.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
      stdout: `${messages.taskList.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }
  const taskStore = dependencies.createTaskStore(db)
  /**
   * 查询条件始终绑定 `projectId`，这是跨项目隔离的关键。
   * 即使多个项目共用一份全局数据库，也不能让列表命令跨项目串数据。
   */
  const tasks = taskStore.listTasks({
    projectId: `project:${managedProject.projectRoot}`,
    status: args.status,
  })

  db.close()

  if (tasks.length === 0) {
    return {
      exitCode: 0,
      stdout: [
        messages.taskList.empty,
        `- projectRoot: ${managedProject.projectRoot}`,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskList.title,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- total: ${tasks.length}`,
      '',
      ...tasks.map(
        (task, index) => `${index + 1}. [${task.status}][${task.priority}][${task.task_type}] ${task.title}`,
      ),
    ].join('\n'),
  }
}
