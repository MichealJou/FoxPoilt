import type { CliRuntimeContext } from '../../cli/runtime-context.js'
import type { bootstrapDatabase } from '../../db/bootstrap.js'
import type { createTaskStore } from '../../db/task-store.js'
import type { resolveManagedProject } from '../../project/resolve-project.js'

export type TaskUpdateStatus = 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'

export type TaskUpdateStatusArgs = {
  command: 'task'
  subcommand: 'update-status'
  help: boolean
  path?: string
  id?: string
  status?: TaskUpdateStatus
}

export type TaskUpdateStatusDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

export type TaskUpdateStatusContext = CliRuntimeContext & {
  dependencies?: Partial<TaskUpdateStatusDependencies>
}
