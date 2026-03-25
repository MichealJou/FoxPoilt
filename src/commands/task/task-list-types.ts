import type { CliRuntimeContext } from '../../cli/runtime-context.js'
import type { bootstrapDatabase } from '../../db/bootstrap.js'
import type { createTaskStore } from '../../db/task-store.js'
import type { resolveManagedProject } from '../../project/resolve-project.js'

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
  command: 'task'
  subcommand: 'list'
  help: boolean
  path?: string
  status?: TaskStatus
}

export type TaskListDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

export type TaskListContext = CliRuntimeContext & {
  dependencies?: Partial<TaskListDependencies>
}
