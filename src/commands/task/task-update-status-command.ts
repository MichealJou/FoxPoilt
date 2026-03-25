import type { CliResult } from '../init/init-types.js'
import { bootstrapDatabase } from '../../db/bootstrap.js'
import { createTaskStore } from '../../db/task-store.js'
import { resolveGlobalDatabasePath } from '../../core/paths.js'
import { ProjectNotInitializedError, resolveManagedProject } from '../../project/resolve-project.js'

import type {
  TaskUpdateStatusArgs,
  TaskUpdateStatusContext,
  TaskUpdateStatusDependencies,
} from './task-update-status-types.js'

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

function buildHelpText(): string {
  return [
    'foxpilot task update-status',
    'fp task update-status',
    '--id <task-id>',
    '--status todo|analyzing|awaiting_plan_confirm|executing|awaiting_result_confirm|done|blocked|cancelled',
    '--path <project-root>',
  ].join('\n')
}

export async function runTaskUpdateStatusCommand(
  args: TaskUpdateStatusArgs,
  context: TaskUpdateStatusContext,
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
      stdout: '[FoxPilot] 任务状态更新失败: id 不能为空',
    }
  }

  if (!args.status) {
    return {
      exitCode: 1,
      stdout: '[FoxPilot] 任务状态更新失败: status 非法或缺失',
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
        stdout: `[FoxPilot] 任务状态更新失败: 项目尚未初始化\n- projectRoot: ${error.projectRoot}`,
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
      stdout: `[FoxPilot] 任务状态更新失败: foxpilot.db 初始化失败\n- ${resolveGlobalDatabasePath(context.homeDir)}`,
    }
  }
  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const existingTask = taskStore.getTaskById({
    projectId,
    taskId: args.id.trim(),
  })

  if (!existingTask) {
    db.close()
    return {
      exitCode: 1,
      stdout: `[FoxPilot] 任务状态更新失败: 未找到任务\n- taskId: ${args.id.trim()}`,
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
      stdout: `[FoxPilot] 任务状态更新失败: 未找到任务\n- taskId: ${args.id.trim()}`,
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] 已更新任务状态',
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${args.id.trim()}`,
      `- from: ${existingTask.status}`,
      `- to: ${args.status}`,
    ].join('\n'),
  }
}
