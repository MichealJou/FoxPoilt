/**
 * @file src/commands/task/task-update-executor-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { TaskReferenceArgs } from '@/commands/task/task-reference.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task update-executor` 接受的执行器集合。
 */
export type TaskExecutor = 'codex' | 'beads' | 'none'

/**
 * `task update-executor` 的标准化参数。
 */
export type TaskUpdateExecutorArgs = TaskReferenceArgs & {
  command: 'task'
  subcommand: 'update-executor'
  help: boolean
  json: boolean
  path?: string
  executor?: TaskExecutor
}

/**
 * 任务执行器更新命令使用的可注入依赖。
 */
export type TaskUpdateExecutorDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务执行器更新命令时使用的运行时上下文。
 */
export type TaskUpdateExecutorContext = CliRuntimeContext<TaskUpdateExecutorDependencies>
