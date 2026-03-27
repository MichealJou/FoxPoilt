/**
 * @file src/commands/task/task-next-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@foxpilot/infra/db/bootstrap.js'
import type { createTaskStore } from '@foxpilot/infra/db/task-store.js'
import type { resolveManagedProject } from '@foxpilot/infra/project/resolve-project.js'

import type { TaskExecutor, TaskSourceType } from '@/commands/task/task-list-types.js'

/**
 * `task next` 的标准化参数。
 *
 * 这条命令只解决一个问题：在当前项目里选出最值得先推进的一条任务。
 * 因此参数刻意保持最小，只允许在“来源”和“当前责任执行器”两个维度继续收窄。
 */
export type TaskNextArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `next`。 */
  subcommand: 'next'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选的项目根目录覆盖值。 */
  path?: string
  /** 可选来源过滤条件。 */
  source?: TaskSourceType
  /** 可选执行器过滤条件。 */
  executor?: TaskExecutor
}

/**
 * 任务下一条命令的可注入依赖。
 */
export type TaskNextDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行 `task next` 时使用的运行时上下文。
 */
export type TaskNextContext = CliRuntimeContext<TaskNextDependencies>
