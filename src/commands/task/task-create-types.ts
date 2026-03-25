import type { CliRuntimeContext } from '../../cli/runtime-context.js'
import type { readGlobalConfig } from '../../config/global-config.js'
import type { bootstrapDatabase } from '../../db/bootstrap.js'
import type { createTaskStore } from '../../db/task-store.js'
import type { resolveManagedProject } from '../../project/resolve-project.js'

export type TaskCreateArgs = {
  command: 'task'
  subcommand: 'create'
  help: boolean
  path?: string
  title?: string
  description?: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  taskType: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init'
  repository?: string
}

export type TaskCreateDependencies = {
  readGlobalConfig: typeof readGlobalConfig
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

export type TaskCreateContext = CliRuntimeContext & {
  dependencies?: Partial<TaskCreateDependencies>
}
