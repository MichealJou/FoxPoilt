/**
 * @file src/commands/task/task-push-beads-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@infra/db/bootstrap.js'
import type { createTaskStore } from '@infra/db/task-store.js'
import type { resolveManagedProject } from '@infra/project/resolve-project.js'
import type { hasLocalBeadsRepository, runBdUpdate } from '@integrations/sync/beads-bd-service.js'

/**
 * `task push-beads` 的标准化参数。
 *
 * 这条命令只负责把“已经从 Beads 导入的任务当前态”回写到对应仓库的本地 bd 数据库，
 * 不负责新建外部任务，也不直接处理网络同步。
 */
export type TaskPushBeadsArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `push-beads`。 */
  subcommand: 'push-beads'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 指定单个仓库做批量回写。 */
  repository?: string
  /** 为 true 时，对项目内全部仓库执行聚合回写。 */
  allRepositories: boolean
  /** FoxPilot 内部任务主键。 */
  id?: string
  /** 外部任务号；未提供内部 ID 时默认按 Beads 来源解析。 */
  externalId?: string
  /** 外部来源键；当前仅允许 beads。 */
  externalSource?: 'beads'
  /** 为 true 时只预演计划回写内容，不真正调用 bd update。 */
  dryRun: boolean
}

/**
 * Beads 回写命令的可注入依赖。
 */
export type TaskPushBeadsDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
  hasLocalBeadsRepository: typeof hasLocalBeadsRepository
  runBdUpdate: typeof runBdUpdate
}

/**
 * 执行 Beads 回写命令时的运行时上下文。
 */
export type TaskPushBeadsContext = CliRuntimeContext<TaskPushBeadsDependencies>
