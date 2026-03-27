/**
 * @file src/commands/init/init-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { ensureGlobalConfig } from '@/config/global-config.js'
import type { ProjectProfileId } from '@/contracts/orchestration-contract.js'
import type { createCatalogStore } from '@/db/catalog-store.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { writeProjectConfig } from '@/project/project-config.js'
import type { scanRepositories } from '@/project/scan-repositories.js'
import type { resolveProjectPlatformResolution } from '@/runtime/orchestrators/platform-resolver.js'

/**
 * 初始化流程支持的交互模式。
 *
 * 交互模式影响的是“是否主动向用户询问缺省值”，
 * 不影响最终写入的数据结构和数据库格式。
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
  /** 第二阶段项目协作 profile。 */
  profile?: ProjectProfileId
  /** 选定的执行模式。 */
  mode: InitMode
  /** 是否跳过仓库扫描。 */
  noScan: boolean
}

/**
 * 所有命令处理器共用的标准 CLI 返回结构。
 *
 * 当前刻意只保留 `exitCode` 和 `stdout`：
 * - CLI 层输出保持纯文本，便于测试断言；
 * - 复杂日志和结构化事件后续再单独设计，不和终端返回耦合。
 */
export type CliResult = {
  /** 由 CLI 包装层向外暴露的进程退出码。 */
  exitCode: number
  /** 已经格式化好的面向用户的纯文本输出。 */
  stdout: string
}

/**
 * init 命令使用的可注入依赖。
 *
 * init 是当前 CLI 里编排最重的命令，因此依赖也最多。
 * 但这些依赖都围绕三个职责分组：
 * - 配置文件读写；
 * - 仓库扫描；
 * - SQLite catalog 初始化与登记。
 */
export type InitCommandDependencies = {
  ensureGlobalConfig: typeof ensureGlobalConfig
  scanRepositories: typeof scanRepositories
  bootstrapDatabase: typeof bootstrapDatabase
  createCatalogStore: typeof createCatalogStore
  writeProjectConfig: typeof writeProjectConfig
  resolvePlatformResolution: typeof resolveProjectPlatformResolution
}

/**
 * init 命令使用的运行时上下文，包含可选的测试覆盖依赖。
 *
 * 由于 init 同时涉及交互输入、主目录、项目目录和数据库路径，
 * 它几乎会使用 `CliRuntimeContext` 的全部字段，因此这里直接继承完整上下文。
 */
export type InitCommandContext = CliRuntimeContext<InitCommandDependencies>
