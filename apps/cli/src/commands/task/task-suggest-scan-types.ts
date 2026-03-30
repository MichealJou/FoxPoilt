/**
 * @file src/commands/task/task-suggest-scan-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@foxpilot/infra/db/bootstrap.js'
import type { createTaskStore } from '@foxpilot/infra/db/task-store.js'
import type { resolveManagedProject } from '@foxpilot/infra/project/resolve-project.js'

/**
 * `task suggest-scan` 的标准化参数。
 *
 * 这条命令不接受复杂过滤器，只负责基于当前项目已有仓库列表生成建议任务。
 */
export type TaskSuggestScanArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `suggest-scan`。 */
  subcommand: 'suggest-scan'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
}

/**
 * 扫描建议命令使用的可注入依赖。
 */
export type TaskSuggestScanDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行扫描建议命令时使用的运行时上下文。
 */
export type TaskSuggestScanContext = CliRuntimeContext<TaskSuggestScanDependencies>
