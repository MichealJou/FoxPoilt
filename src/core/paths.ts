/**
 * @file src/core/paths.ts
 * @author michaeljou
 */

import path from 'node:path'

/**
 * Resolves the root directory used by FoxPilot under the user's home.
 */
export function resolveFoxpilotHome(homeDir: string): string {
  return path.join(homeDir, '.foxpilot')
}

/**
 * Resolves the global config file path.
 */
export function resolveGlobalConfigPath(homeDir: string): string {
  return path.join(resolveFoxpilotHome(homeDir), 'foxpilot.config.json')
}

/**
 * Resolves the global SQLite catalog path.
 */
export function resolveGlobalDatabasePath(homeDir: string): string {
  return path.join(resolveFoxpilotHome(homeDir), 'foxpilot.db')
}

/**
 * Resolves the per-project config file path.
 */
export function resolveProjectConfigPath(projectRoot: string): string {
  return path.join(projectRoot, '.foxpilot', 'project.json')
}
