/**
 * @file src/commands/task/task-update-status-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * Supported task states accepted by `task update-status`.
 */
export type TaskUpdateStatus = 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'

/**
 * Normalized arguments for `task update-status`.
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
 * Injectable collaborators used by task status updates.
 */
export type TaskUpdateStatusDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * Runtime context used while changing task state.
 */
export type TaskUpdateStatusContext = CliRuntimeContext & {
  dependencies?: Partial<TaskUpdateStatusDependencies>
}
