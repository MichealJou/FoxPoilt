/**
 * @file src/commands/task/task-export-beads-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { writeJsonFile } from '@infra/core/json-file.js'
import type { bootstrapDatabase } from '@infra/db/bootstrap.js'
import type { createTaskStore } from '@infra/db/task-store.js'
import type { resolveManagedProject } from '@infra/project/resolve-project.js'

/**
 * `task export-beads` 的标准化参数。
 *
 * 第一版保持最小输入集合：
 * - 可选项目根目录；
 * - 必填导出文件路径。
 *
 * 命令只负责把当前项目中的 `beads_sync` 任务导出为本地快照，
 * 不直接访问任何真实 Beads 网络接口。
 */
export type TaskExportBeadsArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `export-beads`。 */
  subcommand: 'export-beads'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 导出的 JSON 文件路径。 */
  file?: string
}

/**
 * 导出命令使用的可注入依赖。
 *
 * 这里把 JSON 写盘能力也纳入依赖，方便测试里替换为故障桩。
 */
export type TaskExportBeadsDependencies = {
  writeJsonFile: typeof writeJsonFile
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行导出命令时使用的运行时上下文。
 */
export type TaskExportBeadsContext = CliRuntimeContext<TaskExportBeadsDependencies>
