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
 * 初始化流程支持的交互模式。
 */
export type InitMode = 'interactive' | 'non-interactive'

/**
 * `foxpilot init` 的标准化参数。
 */
export type InitArgs = {
  /** 顶层命令标识。 */
  command: 'init'
  /** 是否直接输出帮助，而不是执行初始化。 */
  help: boolean
  /** 可选的项目根目录覆盖值。 */
  path?: string
  /** 可选的项目标识覆盖值。 */
  name?: string
  /** 可选的工作区根目录覆盖值。 */
  workspaceRoot?: string
  /** 选定的执行模式。 */
  mode: InitMode
  /** 是否跳过仓库扫描。 */
  noScan: boolean
}

/**
 * 所有命令处理器共用的标准 CLI 返回结构。
 */
export type CliResult = {
  /** 由 CLI 包装层向外暴露的进程退出码。 */
  exitCode: number
  /** 已经格式化好的面向用户的纯文本输出。 */
  stdout: string
}

/**
 * init 命令使用的可注入依赖。
 */
export type InitCommandDependencies = {
  ensureGlobalConfig: typeof ensureGlobalConfig
  scanRepositories: typeof scanRepositories
  bootstrapDatabase: typeof bootstrapDatabase
  createCatalogStore: typeof createCatalogStore
  writeProjectConfig: typeof writeProjectConfig
}

/**
 * init 命令使用的运行时上下文，包含可选的测试覆盖依赖。
 */
export type InitCommandContext = CliRuntimeContext & {
  dependencies?: Partial<InitCommandDependencies>
}
