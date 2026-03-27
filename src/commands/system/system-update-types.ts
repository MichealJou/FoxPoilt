/**
 * @file src/commands/system/system-update-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { InstallManifest } from '@infra/install/install-types.js'

/**
 * `update` 命令只接受帮助开关。
 */
export type SystemUpdateArgs = {
  command: 'update'
  help: boolean
  json: boolean
}

/**
 * `update` 命令依赖集合。
 */
export type SystemUpdateDependencies = {
  readInstallManifest: (input: { executablePath: string }) => Promise<InstallManifest | undefined>
  dispatchUpdate: (manifest: InstallManifest) => Promise<string>
}

/**
 * `update` 命令运行时上下文。
 */
export type SystemUpdateContext = CliRuntimeContext<SystemUpdateDependencies>
