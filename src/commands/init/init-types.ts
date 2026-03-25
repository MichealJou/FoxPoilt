import type { CliRuntimeContext } from '../../cli/runtime-context.js'
import type { ensureGlobalConfig } from '../../config/global-config.js'
import type { createCatalogStore } from '../../db/catalog-store.js'
import type { bootstrapDatabase } from '../../db/bootstrap.js'
import type { writeProjectConfig } from '../../project/project-config.js'
import type { scanRepositories } from '../../project/scan-repositories.js'

export type InitMode = 'interactive' | 'non-interactive'

export type InitArgs = {
  command: 'init'
  help: boolean
  path?: string
  name?: string
  workspaceRoot?: string
  mode: InitMode
  noScan: boolean
}

export type CliResult = {
  exitCode: number
  stdout: string
}

export type InitCommandDependencies = {
  ensureGlobalConfig: typeof ensureGlobalConfig
  scanRepositories: typeof scanRepositories
  bootstrapDatabase: typeof bootstrapDatabase
  createCatalogStore: typeof createCatalogStore
  writeProjectConfig: typeof writeProjectConfig
}

export type InitCommandContext = CliRuntimeContext & {
  dependencies?: Partial<InitCommandDependencies>
}
