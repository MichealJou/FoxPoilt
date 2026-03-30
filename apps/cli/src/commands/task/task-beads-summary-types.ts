/**
 * @file src/commands/task/task-beads-summary-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@foxpilot/infra/db/bootstrap.js'
import type { createTaskStore } from '@foxpilot/infra/db/task-store.js'
import type { resolveManagedProject } from '@foxpilot/infra/project/resolve-project.js'

/**
 * `task beads-summary` 的标准化参数。
 *
 * 这一版摘要命令只关心当前项目，不再额外支持来源或状态过滤，
 * 因为它的目标就是快速给出当前项目内 `Beads` 同步任务的整体概况。
 */
export type TaskBeadsSummaryArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `beads-summary`。 */
  subcommand: 'beads-summary'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
}

/**
 * 摘要命令使用的可注入依赖。
 */
export type TaskBeadsSummaryDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行摘要命令时使用的运行时上下文。
 */
export type TaskBeadsSummaryContext = CliRuntimeContext<TaskBeadsSummaryDependencies>
