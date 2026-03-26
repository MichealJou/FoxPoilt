/**
 * @file src/commands/task/task-show-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { TaskReferenceArgs } from '@/commands/task/task-reference.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task show` 的标准化参数。
 *
 * 详情查询的输入要求比列表更严格：必须给出任务 ID，
 * 但仍允许通过 `path` 指定项目根，以便从任意目录查看目标项目中的任务详情。
 */
export type TaskShowArgs = TaskReferenceArgs & {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `show`。 */
  subcommand: 'show'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
}

/**
 * 任务详情查询命令使用的可注入依赖。
 */
export type TaskShowDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务详情查询命令时使用的运行时上下文。
 *
 * 由于详情查询既依赖项目定位，也依赖数据库读取，
 * 所以它沿用统一的 CLI 上下文，并额外允许注入局部依赖做测试替换。
 */
export type TaskShowContext = CliRuntimeContext<TaskShowDependencies>
