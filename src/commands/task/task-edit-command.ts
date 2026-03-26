/**
 * @file src/commands/task/task-edit-command.ts
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
  TaskEditArgs,
  TaskEditContext,
  TaskEditDependencies,
} from '@/commands/task/task-edit-types.js'

/**
 * 解析任务元数据编辑命令使用的默认依赖集合。
 */
function getDependencies(
  overrides: Partial<TaskEditDependencies> = {},
): TaskEditDependencies {
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
    messages.taskEdit.helpDescription,
    '',
    'foxpilot task edit',
    'fp task edit',
    '--id <task-id>',
    '--external-id <external-task-id>',
    '--external-source beads',
    '--title <title>',
    '--description <description>',
    '--clear-description',
    '--task-type generic|frontend|backend|cross_repo|docs|init',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 编辑任务当前态中的可变元数据。
 *
 * 当前只开放人工最常改的三类字段：
 * - 标题
 * - 描述
 * - 任务类型
 *
 * 这样可以避免用户为了改一行文案重新建任务，同时又不把状态流转、
 * 执行器切换、优先级调整等职责混进一个“万能命令”里。
 */
export async function runTaskEditCommand(
  args: TaskEditArgs,
  context: TaskEditContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  const hasTitle = args.title !== undefined
  const hasDescription = args.description !== undefined
  const hasTaskType = args.taskType !== undefined

  if (!hasTitle && !hasDescription && !hasTaskType && !args.clearDescription) {
    return {
      exitCode: 1,
      stdout: messages.taskEdit.noChangesSpecified,
    }
  }

  if (hasDescription && args.clearDescription) {
    return {
      exitCode: 1,
      stdout: messages.taskEdit.conflictingDescription,
    }
  }

  if (hasTitle && !args.title?.trim()) {
    return {
      exitCode: 1,
      stdout: messages.taskEdit.titleRequired,
    }
  }

  if (hasDescription && !args.description?.trim()) {
    return {
      exitCode: 1,
      stdout: messages.taskEdit.descriptionRequired,
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
        stdout: `${messages.taskEdit.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
      stdout: `${messages.taskEdit.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const taskReference = resolveTaskReference({
    args,
    projectId,
    taskStore,
    messages: {
      idRequired: messages.taskEdit.idRequired,
      taskNotFound: messages.taskEdit.taskNotFound,
    },
  })

  if (!taskReference.ok) {
    db.close()
    return {
      exitCode: 1,
      stdout: taskReference.stdout,
    }
  }

  const detail = taskStore.getTaskDetail({
    projectId,
    taskId: taskReference.value.taskId,
  })

  if (!detail) {
    db.close()
    return {
      exitCode: 1,
      stdout: [
        messages.taskEdit.taskNotFound,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
      ].join('\n'),
    }
  }

  const nextTitle = hasTitle ? args.title!.trim() : detail.task.title
  const nextDescription = hasDescription
    ? args.description!.trim()
    : args.clearDescription
      ? null
      : detail.task.description
  const nextTaskType = hasTaskType ? args.taskType! : detail.task.task_type

  if (
    nextTitle === detail.task.title &&
    nextDescription === detail.task.description &&
    nextTaskType === detail.task.task_type
  ) {
    db.close()
    return {
      exitCode: 0,
      stdout: [
        messages.taskEdit.unchanged,
        `- projectRoot: ${managedProject.projectRoot}`,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
      ].join('\n'),
    }
  }

  const updated = taskStore.updateTaskMetadata({
    projectId,
    taskId: taskReference.value.taskId,
    title: nextTitle,
    description: nextDescription,
    taskType: nextTaskType,
    updatedAt: new Date().toISOString(),
  })

  db.close()

  if (!updated) {
    return {
      exitCode: 1,
      stdout: [
        messages.taskEdit.taskNotFound,
        `- taskId: ${taskReference.value.taskId}`,
        ...taskReference.value.referenceLines,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskEdit.updated,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${taskReference.value.taskId}`,
      ...taskReference.value.referenceLines,
      `- title: ${nextTitle}`,
      `- description: ${nextDescription ?? '(cleared)'}`,
      `- taskType: ${nextTaskType}`,
    ].join('\n'),
  }
}
