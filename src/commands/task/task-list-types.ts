/**
 * @file src/commands/task/task-list-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

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
 * `task list` 的标准化参数。
 *
 * 列表命令的输入故意保持极简，只支持项目路径和状态过滤。
 * 这样可以让它稳定承担“人工查看当前态列表”的职责，不掺杂过多报表逻辑。
 */
export type TaskListArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `list`。 */
  subcommand: 'list'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 可选的项目根目录覆盖值。 */
  path?: string
  /** 可选状态过滤条件；为空时返回当前项目下的全部任务。 */
  status?: TaskStatus
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
export type TaskListContext = CliRuntimeContext & {
  dependencies?: Partial<TaskListDependencies>
}
