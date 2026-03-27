/**
 * @file src/commands/task/task-list-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@infra/db/bootstrap.js'
import type { createTaskStore } from '@infra/db/task-store.js'
import type { resolveManagedProject } from '@infra/project/resolve-project.js'

/**
 * 用于过滤和更新的任务状态集合。
 *
 * 这里抽成独立类型，是为了让：
 * - 参数解析器；
 * - 列表筛选；
 * - 状态更新；
 * 在同一套状态字面量上对齐，避免不同文件各写一份枚举导致漂移。
 */
export type TaskStatus =
  | 'todo'
  | 'analyzing'
  | 'awaiting_plan_confirm'
  | 'executing'
  | 'awaiting_result_confirm'
  | 'done'
  | 'blocked'
  | 'cancelled'

/**
 * 任务来源集合。
 */
export type TaskSourceType = 'manual' | 'beads_sync' | 'scan_suggestion'

/**
 * 当前责任执行器集合。
 */
export type TaskExecutor = 'codex' | 'beads' | 'none'

/**
 * `task list` 的标准化参数。
 *
 * 列表命令的输入保持轻量，但已经支持最常见的三类当前态筛选：
 * - 状态
 * - 来源
 * - 当前责任执行器
 */
export type TaskListArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `list`。 */
  subcommand: 'list'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选的项目根目录覆盖值。 */
  path?: string
  /** 可选状态过滤条件；为空时返回当前项目下的全部任务。 */
  status?: TaskStatus
  /** 可选任务来源过滤条件。 */
  source?: TaskSourceType
  /** 可选当前责任执行器过滤条件。 */
  executor?: TaskExecutor
}

/**
 * 任务列表命令使用的可注入依赖。
 */
export type TaskListDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务列表命令时使用的运行时上下文。
 *
 * 它继承所有 CLI 共享上下文，并允许在测试里替换局部依赖，
 * 例如用内存数据库模拟不同项目下的任务列表。
 */
export type TaskListContext = CliRuntimeContext<TaskListDependencies>
