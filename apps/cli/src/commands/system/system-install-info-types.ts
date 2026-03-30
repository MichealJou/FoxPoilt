/**
 * @file src/commands/system/system-install-info-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { InstallIndexEntry, InstallManifest } from '@foxpilot/infra/install/install-types.js'

/**
 * `install-info` 命令只接受帮助开关。
 */
export type SystemInstallInfoArgs = {
  command: 'install-info'
  help: boolean
  json: boolean
}

/**
 * `install-info` 命令可替换依赖。
 */
export type SystemInstallInfoDependencies = {
  readInstallManifest: (input: { executablePath: string }) => Promise<InstallManifest | undefined>
  readInstallIndex: (input: { homeDir: string }) => Promise<InstallIndexEntry[]>
}

/**
 * `install-info` 命令运行时上下文。
 */
export type SystemInstallInfoContext = CliRuntimeContext<SystemInstallInfoDependencies>
