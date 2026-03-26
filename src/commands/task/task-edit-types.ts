/**
 * @file src/commands/task/task-edit-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { TaskReferenceArgs } from '@/commands/task/task-reference.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task edit` 允许写入的任务类型集合。
 */
export type EditableTaskType =
  | 'generic'
  | 'frontend'
  | 'backend'
  | 'cross_repo'
  | 'docs'
  | 'init'

/**
 * `task edit` 的标准化参数。
 */
export type TaskEditArgs = TaskReferenceArgs & {
  command: 'task'
  subcommand: 'edit'
  help: boolean
  path?: string
  title?: string
  description?: string
  clearDescription: boolean
  taskType?: EditableTaskType
}

/**
 * 任务元数据编辑命令使用的可注入依赖。
 */
export type TaskEditDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务元数据编辑命令时使用的运行时上下文。
 */
export type TaskEditContext = CliRuntimeContext<TaskEditDependencies>
