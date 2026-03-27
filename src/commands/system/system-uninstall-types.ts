/**
 * @file src/commands/system/system-uninstall-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { InstallManifest } from '@infra/install/install-types.js'

/**
 * `uninstall` 命令接受的标准化参数。
 */
export type SystemUninstallArgs = {
  command: 'uninstall'
  help: boolean
  json: boolean
  purge: boolean
}

/**
 * `uninstall` 命令依赖集合。
 */
export type SystemUninstallDependencies = {
  readInstallManifest: (input: { executablePath: string }) => Promise<InstallManifest | undefined>
  dispatchUninstall: (manifest: InstallManifest) => Promise<string>
  unregisterCurrentInstallation: (input: {
    homeDir: string
    manifest: Pick<InstallManifest, 'installMethod' | 'platform' | 'arch' | 'installRoot'>
  }) => Promise<{ indexPath: string; remainingCount: number }>
  purgeUserData: (input: { homeDir: string }) => Promise<void>
}

/**
 * `uninstall` 命令运行时上下文。
 */
export type SystemUninstallContext = CliRuntimeContext<SystemUninstallDependencies>
