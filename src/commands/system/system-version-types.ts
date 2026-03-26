/**
 * @file src/commands/system/system-version-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'

/**
 * `version` 命令只接受帮助开关，不需要额外参数。
 */
export type SystemVersionArgs = {
  command: 'version'
  help: boolean
}

/**
 * `version` 命令预留的依赖集合。
 */
export type SystemVersionDependencies = Record<string, unknown>

/**
 * `version` 命令运行时上下文。
 */
export type SystemVersionContext = CliRuntimeContext<SystemVersionDependencies>
