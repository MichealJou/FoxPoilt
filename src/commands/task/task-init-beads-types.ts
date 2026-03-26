/**
 * @file src/commands/task/task-init-beads-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'
import type { hasLocalBeadsRepository, runBdInit } from '@/sync/beads-bd-service.js'

/**
 * `task init-beads` 的标准化参数。
 *
 * 这条命令负责给受管仓库补齐本地 `.beads` 初始化，
 * 作为 `task doctor-beads` 之后的最小修复入口。
 */
export type TaskInitBeadsArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `init-beads`。 */
  subcommand: 'init-beads'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 需要初始化的单仓库选择器。 */
  repository?: string
  /** 为 true 时，对当前项目的全部仓库执行初始化。 */
  allRepositories: boolean
  /** 为 true 时，只预演初始化计划，不真正执行 `bd init`。 */
  dryRun: boolean
}

/**
 * 本地 Beads 初始化命令的可注入依赖。
 */
export type TaskInitBeadsDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  hasLocalBeadsRepository: typeof hasLocalBeadsRepository
  runBdInit: typeof runBdInit
}

/**
 * 执行本地 Beads 初始化命令时的运行时上下文。
 */
export type TaskInitBeadsContext = CliRuntimeContext<TaskInitBeadsDependencies>
