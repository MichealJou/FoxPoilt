/**
 * @file src/commands/task/task-list-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * 用于过滤和更新的任务状态集合。
 */
export type TaskStatus =
  | 'todo'
  | 'analyzing'
  | 'awaiting_plan_confirm'
  | 'executing'
  | 'awaiting_result_confirm'
  | 'done'
  | 'blocked'
  | 'cancelled'

export type TaskListArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** Subcommand identifier. */
  subcommand: 'list'
  /** Whether help should be rendered. */
  help: boolean
  /** 可选的项目根目录覆盖值。 */
  path?: string
  /** Optional status filter applied at query time. */
  status?: TaskStatus
}

/**
 * 任务列表命令使用的可注入依赖。
 */
export type TaskListDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务列表命令时使用的运行时上下文。
 */
export type TaskListContext = CliRuntimeContext & {
  dependencies?: Partial<TaskListDependencies>
}
