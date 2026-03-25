/**
 * @file src/commands/task/task-history-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task history` 的标准化参数。
 *
 * 该命令与 `task show` 一样都要求任务 ID，但职责只聚焦在历史序列本身，
 * 不再输出任务目标和当前态摘要。
 */
export type TaskHistoryArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `history`。 */
  subcommand: 'history'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 任务唯一标识，用于加载对应的历史序列。 */
  id?: string
}

/**
 * 任务历史查询命令使用的可注入依赖。
 */
export type TaskHistoryDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务历史查询命令时使用的运行时上下文。
 *
 * 由于它依赖项目定位和数据库读取，所以沿用统一 CLI 上下文，
 * 并允许测试按需替换局部依赖。
 */
export type TaskHistoryContext = CliRuntimeContext & {
  dependencies?: Partial<TaskHistoryDependencies>
}
