/**
 * @file src/commands/task/task-doctor-beads-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@foxpilot/infra/db/bootstrap.js'
import type { resolveManagedProject } from '@foxpilot/infra/project/resolve-project.js'
import type { hasLocalBeadsRepository, runBdList } from '@foxpilot/integrations/sync/beads-bd-service.js'

/**
 * `task doctor-beads` 的标准化参数。
 *
 * 这条命令只做只读诊断，不写数据库，也不回写本地 `bd`：
 * - 可针对单仓库检查；
 * - 也可对当前项目全部仓库做聚合检查；
 * - 主要用于快速定位“为什么 sync / push 不能正常运行”。
 */
export type TaskDoctorBeadsArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `doctor-beads`。 */
  subcommand: 'doctor-beads'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 需要诊断的单仓库选择器。 */
  repository?: string
  /** 为 true 时，对当前项目的全部仓库执行聚合诊断。 */
  allRepositories: boolean
}

/**
 * Beads 环境诊断命令的可注入依赖。
 */
export type TaskDoctorBeadsDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  hasLocalBeadsRepository: typeof hasLocalBeadsRepository
  runBdList: typeof runBdList
}

/**
 * 执行 Beads 环境诊断命令时使用的运行时上下文。
 */
export type TaskDoctorBeadsContext = CliRuntimeContext<TaskDoctorBeadsDependencies>
