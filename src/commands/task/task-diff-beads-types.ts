/**
 * @file src/commands/task/task-diff-beads-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { readJsonFile } from '@/core/json-file.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'
import type { hasLocalBeadsRepository, runBdList } from '@/sync/beads-bd-service.js'

/**
 * `task diff-beads` 的标准化参数。
 *
 * 这一版命令只负责“预览差异”，不真正写库：
 * - 可读取本地快照文件；
 * - 也可直接读取仓库里的 bd 输出；
 * - 可选项目路径；
 * - 可选缺失任务收口预览开关。
 */
export type TaskDiffBeadsArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `diff-beads`。 */
  subcommand: 'diff-beads'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 本地 JSON 快照文件路径。 */
  file?: string
  /** 指定单个仓库做 live diff。 */
  repository?: string
  /** 为 true 时，对全部已初始化本地 Beads 的仓库做聚合预览。 */
  allRepositories: boolean
  /** 为 true 时，预览当前快照中已缺失任务的收口候选。 */
  closeMissing: boolean
}

/**
 * 差异预览命令使用的可注入依赖。
 */
export type TaskDiffBeadsDependencies = {
  readJsonFile: typeof readJsonFile
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
  runBdList: typeof runBdList
  hasLocalBeadsRepository: typeof hasLocalBeadsRepository
}

/**
 * 执行差异预览命令时使用的运行时上下文。
 */
export type TaskDiffBeadsContext = CliRuntimeContext<TaskDiffBeadsDependencies>
