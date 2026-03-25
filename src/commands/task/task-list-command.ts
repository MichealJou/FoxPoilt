import type { CliResult } from '../init/init-types.js'
import { bootstrapDatabase } from '../../db/bootstrap.js'
import { createTaskStore } from '../../db/task-store.js'
import { resolveGlobalDatabasePath } from '../../core/paths.js'
import { ProjectNotInitializedError, resolveManagedProject } from '../../project/resolve-project.js'

import type { TaskListArgs, TaskListContext, TaskListDependencies } from './task-list-types.js'

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

function buildHelpText(): string {
  return [
    'foxpilot task list',
    'fp task list',
    '--path <project-root>',
    '--status todo|analyzing|awaiting_plan_confirm|executing|awaiting_result_confirm|done|blocked|cancelled',
  ].join('\n')
}

export async function runTaskListCommand(
  args: TaskListArgs,
  context: TaskListContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(),
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
        stdout: `[FoxPilot] 任务列表失败: 项目尚未初始化\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  const db = await dependencies.bootstrapDatabase(resolveGlobalDatabasePath(context.homeDir))
  const taskStore = dependencies.createTaskStore(db)
  const tasks = taskStore.listTasks({
    projectId: `project:${managedProject.projectRoot}`,
    status: args.status,
  })

  db.close()

  if (tasks.length === 0) {
    return {
      exitCode: 0,
      stdout: [
        '[FoxPilot] 当前没有匹配任务',
        `- projectRoot: ${managedProject.projectRoot}`,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] 任务列表',
      `- projectRoot: ${managedProject.projectRoot}`,
      `- total: ${tasks.length}`,
      '',
      ...tasks.map(
        (task, index) => `${index + 1}. [${task.status}][${task.priority}][${task.task_type}] ${task.title}`,
      ),
    ].join('\n'),
  }
}
