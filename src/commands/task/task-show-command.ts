import type { CliResult } from '../init/init-types.js'
import { bootstrapDatabase } from '../../db/bootstrap.js'
import { createTaskStore } from '../../db/task-store.js'
import { resolveGlobalDatabasePath } from '../../core/paths.js'
import { ProjectNotInitializedError, resolveManagedProject } from '../../project/resolve-project.js'

import type { TaskShowArgs, TaskShowContext, TaskShowDependencies } from './task-show-types.js'

function getDependencies(
  overrides: Partial<TaskShowDependencies> = {},
): TaskShowDependencies {
  return {
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    ...overrides,
  }
}

function buildHelpText(): string {
  return [
    'foxpilot task show',
    'fp task show',
    '--id <task-id>',
    '--path <project-root>',
  ].join('\n')
}

export async function runTaskShowCommand(
  args: TaskShowArgs,
  context: TaskShowContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(),
    }
  }

  if (!args.id?.trim()) {
    return {
      exitCode: 1,
      stdout: '[FoxPilot] 任务详情失败: id 不能为空',
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
        stdout: `[FoxPilot] 任务详情失败: 项目尚未初始化\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  const db = await dependencies.bootstrapDatabase(resolveGlobalDatabasePath(context.homeDir))
  const taskStore = dependencies.createTaskStore(db)
  const detail = taskStore.getTaskDetail({
    projectId: `project:${managedProject.projectRoot}`,
    taskId: args.id.trim(),
  })

  db.close()

  if (!detail) {
    return {
      exitCode: 1,
      stdout: `[FoxPilot] 任务详情失败: 未找到任务\n- taskId: ${args.id.trim()}`,
    }
  }

  const targetLines =
    detail.targets.length === 0
      ? ['- (none)']
      : detail.targets.map((target, index) => {
          const targetValue = target.repository_path ?? target.target_value ?? '(none)'
          return `${index + 1}. [${target.target_type}] ${targetValue}`
        })

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] 任务详情',
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${detail.task.id}`,
      `- title: ${detail.task.title}`,
      `- status: ${detail.task.status}`,
      `- priority: ${detail.task.priority}`,
      `- taskType: ${detail.task.task_type}`,
      `- executor: ${detail.task.current_executor}`,
      `- updatedAt: ${detail.task.updated_at}`,
      `- description: ${detail.task.description ?? ''}`,
      '',
      '[FoxPilot] 任务目标',
      ...targetLines,
    ].join('\n'),
  }
}
