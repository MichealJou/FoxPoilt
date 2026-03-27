/**
 * @file src/commands/task/task-update-status-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { TaskReferenceArgs } from '@/commands/task/task-reference.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task update-status` 接受的任务状态集合。
 *
 * 这里单独保留一个类型别名，而不是直接复用字符串联合字面量，
 * 是为了让状态更新命令的输入约束在阅读上更直观，也方便未来单独收紧流转规则。
 */
export type TaskUpdateStatus =
  | 'todo'
  | 'analyzing'
  | 'awaiting_plan_confirm'
  | 'executing'
  | 'awaiting_result_confirm'
  | 'done'
  | 'blocked'
  | 'cancelled'

/**
 * `task update-status` 的标准化参数。
 *
 * 该命令需要同时给出任务 ID 和目标状态。
 * 如果任一字段缺失，命令应在命令层快速失败，而不是把空值继续传入 store。
 */
export type TaskUpdateStatusArgs = TaskReferenceArgs & {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `update-status`。 */
  subcommand: 'update-status'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 目标状态；解析器只允许合法枚举进入命令层。 */
  status?: TaskUpdateStatus
}

/**
 * 任务状态更新命令使用的可注入依赖。
 */
export type TaskUpdateStatusDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务状态变更命令时使用的运行时上下文。
 *
 * 这里沿用统一上下文，是为了让状态更新命令也具备：
 * - 路径解析能力；
 * - 当前语言能力；
 * - 测试中的依赖替换能力。
 */
export type TaskUpdateStatusContext = CliRuntimeContext<TaskUpdateStatusDependencies>
