/**
 * @file src/commands/task/task-update-priority-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import { resolveTaskReference } from '@/commands/task/task-reference.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@/project/resolve-project.js'

import type {
  TaskUpdatePriorityArgs,
  TaskUpdatePriorityContext,
  TaskUpdatePriorityDependencies,
} from '@/commands/task/task-update-priority-types.js'

/**
 * 解析任务优先级更新命令使用的默认依赖集合。
 */
function getDependencies(
  overrides: Partial<TaskUpdatePriorityDependencies> = {},
): TaskUpdatePriorityDependencies {
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
    messages.taskUpdatePriority.helpDescription,
    '',
    'foxpilot task update-priority',
    'fp task update-priority',
    '--id <task-id>',
    '--external-id <external-task-id>',
    '--external-source beads',
    '--priority P0|P1|P2|P3',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 更新任务当前优先级。
 *
 * 这条命令只改 `task.priority` 当前态字段，不直接触发额外副作用。
 * 这样可以把“优先级修改”和“如何消费新优先级”分层处理：
 * - 写入层只保证字段被安全更新；
 * - `task list`、`task next` 等读取层会自然体现最新排序结果。
 */
export async function runTaskUpdatePriorityCommand(
  args: TaskUpdatePriorityArgs,
  context: TaskUpdatePriorityContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.priority) {
    return {
      exitCode: 1,
      stdout: messages.taskUpdatePriority.priorityRequired,
    }
  }

  const nextPriority = args.priority
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
        stdout: `${messages.taskUpdatePriority.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
      stdout: `${messages.taskUpdatePriority.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const taskReference = resolveTaskReference({
    args,
    projectId,
    taskStore,
    messages: {
      idRequired: messages.taskUpdatePriority.idRequired,
      taskNotFound: messages.taskUpdatePriority.taskNotFound,
    },
  })

  if (!taskReference.ok) {
    db.close()
    return {
      exitCode: 1,
      stdout: taskReference.stdout,
    }
  }

  const existingTask = taskStore.getTaskById({
    projectId,
    taskId: taskReference.value.taskId,
  })

  if (!existingTask) {
    db.close()
    return {
      exitCode: 1,
      stdout: [
        messages.taskUpdatePriority.taskNotFound,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
      ].join('\n'),
    }
  }

  if (existingTask.priority === nextPriority) {
    db.close()
    return {
      exitCode: 0,
      stdout: [
        messages.taskUpdatePriority.unchanged,
        `- projectRoot: ${managedProject.projectRoot}`,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
        `- priority: ${nextPriority}`,
      ].join('\n'),
    }
  }

  const updated = taskStore.updateTaskPriority({
    projectId,
    taskId: taskReference.value.taskId,
    priority: nextPriority,
    updatedAt: new Date().toISOString(),
  })

  db.close()

  if (!updated) {
    return {
      exitCode: 1,
      stdout: [
        messages.taskUpdatePriority.taskNotFound,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskUpdatePriority.updated,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${taskReference.value.taskId}`,
      ...taskReference.value.referenceLines,
      `- from: ${existingTask.priority}`,
      `- to: ${nextPriority}`,
    ].join('\n'),
  }
}
