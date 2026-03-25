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
 * Resolves the default dependency set for task status updates.
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

function buildHelpText(): string {
  return [
    'foxpilot task update-status',
    'fp task update-status',
    '--id <task-id>',
    '--status todo|analyzing|awaiting_plan_confirm|executing|awaiting_result_confirm|done|blocked|cancelled',
    '--path <project-root>',
  ].join('\n')
}

/**
 * Updates the persisted status of one task inside the current project scope.
 */
export async function runTaskUpdateStatusCommand(
  args: TaskUpdateStatusArgs,
  context: TaskUpdateStatusContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(),
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
