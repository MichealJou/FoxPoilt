/**
 * @file src/commands/task/task-show-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task show` 的标准化参数。
 */
export type TaskShowArgs = {
  command: 'task'
  subcommand: 'show'
  help: boolean
  path?: string
  id?: string
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
 */
export type TaskShowContext = CliRuntimeContext & {
  dependencies?: Partial<TaskShowDependencies>
}
