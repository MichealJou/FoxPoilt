/**
 * @file src/commands/task/task-update-priority-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task update-priority` 接受的优先级集合。
 */
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'

/**
 * `task update-priority` 的标准化参数。
 */
export type TaskUpdatePriorityArgs = {
  command: 'task'
  subcommand: 'update-priority'
  help: boolean
  path?: string
  id?: string
  priority?: TaskPriority
}

/**
 * 任务优先级更新命令使用的可注入依赖。
 */
export type TaskUpdatePriorityDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务优先级更新命令时使用的运行时上下文。
 */
export type TaskUpdatePriorityContext = CliRuntimeContext<TaskUpdatePriorityDependencies>
