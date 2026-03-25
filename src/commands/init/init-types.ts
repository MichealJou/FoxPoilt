/**
 * @file src/commands/init/init-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { ensureGlobalConfig } from '@/config/global-config.js'
import type { createCatalogStore } from '@/db/catalog-store.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { writeProjectConfig } from '@/project/project-config.js'
import type { scanRepositories } from '@/project/scan-repositories.js'

/**
 * Supported initialization interaction modes.
 */
export type InitMode = 'interactive' | 'non-interactive'

/**
 * Normalized arguments for `foxpilot init`.
 */
export type InitArgs = {
  /** Top-level command identifier. */
  command: 'init'
  /** Whether to render help instead of executing initialization. */
  help: boolean
  /** Optional project root override. */
  path?: string
  /** Optional project slug override. */
  name?: string
  /** Optional workspace root override. */
  workspaceRoot?: string
  /** Chosen execution mode. */
  mode: InitMode
  /** Whether repository scanning should be skipped. */
  noScan: boolean
}

/**
 * Standard CLI return contract used by all command handlers.
 */
export type CliResult = {
  /** Process exit code surfaced by the CLI wrapper. */
  exitCode: number
  /** User-facing output already formatted as plain text. */
  stdout: string
}

/**
 * Injectable collaborators used by the init command.
 */
export type InitCommandDependencies = {
  ensureGlobalConfig: typeof ensureGlobalConfig
  scanRepositories: typeof scanRepositories
  bootstrapDatabase: typeof bootstrapDatabase
  createCatalogStore: typeof createCatalogStore
  writeProjectConfig: typeof writeProjectConfig
}

/**
 * Runtime context used by init, including optional test overrides.
 */
export type InitCommandContext = CliRuntimeContext & {
  dependencies?: Partial<InitCommandDependencies>
}
