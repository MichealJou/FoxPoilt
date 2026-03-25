/**
 * @file src/commands/task/task-show-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * Normalized arguments for `task show`.
 */
export type TaskShowArgs = {
  command: 'task'
  subcommand: 'show'
  help: boolean
  path?: string
  id?: string
}

/**
 * Injectable collaborators used by task detail lookups.
 */
export type TaskShowDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * Runtime context used while loading task detail.
 */
export type TaskShowContext = CliRuntimeContext & {
  dependencies?: Partial<TaskShowDependencies>
}
