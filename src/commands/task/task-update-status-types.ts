/**
 * @file src/commands/task/task-update-status-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task update-status` 接受的任务状态集合。
 */
export type TaskUpdateStatus = 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'

/**
 * `task update-status` 的标准化参数。
 */
export type TaskUpdateStatusArgs = {
  command: 'task'
  subcommand: 'update-status'
  help: boolean
  path?: string
  id?: string
  status?: TaskUpdateStatus
}

/**
 * 任务状态更新命令使用的可注入依赖。
 */
export type TaskUpdateStatusDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务状态变更命令时使用的运行时上下文。
 */
export type TaskUpdateStatusContext = CliRuntimeContext & {
  dependencies?: Partial<TaskUpdateStatusDependencies>
}
