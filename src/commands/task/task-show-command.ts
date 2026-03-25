/**
 * @file src/commands/task/task-show-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@/project/resolve-project.js'

import type { TaskShowArgs, TaskShowContext, TaskShowDependencies } from '@/commands/task/task-show-types.js'

/**
 * Resolves the default dependency set for task detail lookup.
 */
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

function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskShow.helpDescription,
    '',
    'foxpilot task show',
    'fp task show',
    '--id <task-id>',
    '--path <project-root>',
  ].join('\n')
}

/**
 * Loads one task together with its targets for human-readable inspection.
 */
export async function runTaskShowCommand(
  args: TaskShowArgs,
  context: TaskShowContext,
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
      stdout: messages.taskShow.idRequired,
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
        stdout: `${messages.taskShow.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
      stdout: `${messages.taskShow.taskNotFound}\n- taskId: ${args.id.trim()}`,
    }
  }

  const targetLines =
    detail.targets.length === 0
      ? [messages.taskShow.noTargets]
      : detail.targets.map((target, index) => {
          const targetValue = target.repository_path ?? target.target_value ?? '(none)'
          return `${index + 1}. [${target.target_type}] ${targetValue}`
        })

  return {
    exitCode: 0,
    stdout: [
      messages.taskShow.title,
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
      messages.taskShow.targetsTitle,
      ...targetLines,
    ].join('\n'),
  }
}
