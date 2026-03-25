/**
 * @file src/commands/task/task-list-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * Supported task states for filtering and updates.
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
  /** Top-level command identifier. */
  command: 'task'
  /** Subcommand identifier. */
  subcommand: 'list'
  /** Whether help should be rendered. */
  help: boolean
  /** Optional project root override. */
  path?: string
  /** Optional status filter applied at query time. */
  status?: TaskStatus
}

/**
 * Injectable collaborators used by task listing.
 */
export type TaskListDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * Runtime context used while listing tasks.
 */
export type TaskListContext = CliRuntimeContext & {
  dependencies?: Partial<TaskListDependencies>
}
