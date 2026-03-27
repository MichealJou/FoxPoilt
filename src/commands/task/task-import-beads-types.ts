/**
 * @file src/commands/task/task-import-beads-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { readJsonFile } from '@infra/core/json-file.js'
import type { bootstrapDatabase } from '@infra/db/bootstrap.js'
import type { createTaskStore } from '@infra/db/task-store.js'
import type { resolveManagedProject } from '@infra/project/resolve-project.js'

/**
 * `task import-beads` 的标准化参数。
 *
 * 这一版导入命令只接受最小输入集合：
 * - 可选的受管项目路径；
 * - 必填的本地快照文件路径。
 * - 可选的“缺失任务收口”开关。
 * - 可选的“只预演不落库”开关。
 *
 * 命令不会直接访问网络，也不会读取真实 Beads API。
 */
export type TaskImportBeadsArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `import-beads`。 */
  subcommand: 'import-beads'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 本地 JSON 快照文件路径。 */
  file?: string
  /** 为 true 时，收口当前快照中已缺失的未完成导入任务。 */
  closeMissing: boolean
  /** 为 true 时，只输出导入统计，不真正写入数据库。 */
  dryRun: boolean
}

/**
 * 导入命令使用的可注入依赖。
 *
 * 这里显式把快照读取也纳入依赖，是为了在测试里方便替换成故障注入或内存桩。
 */
export type TaskImportBeadsDependencies = {
  readJsonFile: typeof readJsonFile
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行导入命令时使用的运行时上下文。
 */
export type TaskImportBeadsContext = CliRuntimeContext<TaskImportBeadsDependencies>
