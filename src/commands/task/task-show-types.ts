import type { CliRuntimeContext } from '../../cli/runtime-context.js'
import type { bootstrapDatabase } from '../../db/bootstrap.js'
import type { createTaskStore } from '../../db/task-store.js'
import type { resolveManagedProject } from '../../project/resolve-project.js'

export type TaskShowArgs = {
  command: 'task'
  subcommand: 'show'
  help: boolean
  path?: string
  id?: string
}

export type TaskShowDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

export type TaskShowContext = CliRuntimeContext & {
  dependencies?: Partial<TaskShowDependencies>
}
