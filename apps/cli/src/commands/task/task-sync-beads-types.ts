/**
 * @file src/commands/task/task-sync-beads-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { bootstrapDatabase } from '@foxpilot/infra/db/bootstrap.js'
import type { createTaskStore } from '@foxpilot/infra/db/task-store.js'
import type { resolveManagedProject } from '@foxpilot/infra/project/resolve-project.js'
import type {
  hasLocalBeadsRepository,
  runBdList,
} from '@foxpilot/integrations/sync/beads-bd-service.js'

/**
 * `task sync-beads` 的标准化参数。
 *
 * 这条命令不再要求用户先手工准备 JSON 快照，
 * 而是直接从指定仓库里的 `bd list --json --all` 拉取本地 Beads 任务。
 */
export type TaskSyncBeadsArgs = {
  /** 顶层命令标识。 */
  command: 'task'
  /** 二级命令标识，固定为 `sync-beads`。 */
  subcommand: 'sync-beads'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 为 true 时输出结构化 JSON。 */
  json: boolean
  /** 可选项目根目录覆盖值。 */
  path?: string
  /** 需要同步的仓库选择器。 */
  repository?: string
  /** 为 true 时，对当前项目内全部已初始化 Beads 的仓库执行聚合同步。 */
  allRepositories: boolean
  /** 为 true 时，收口当前仓库里已从 Beads 消失的未完成任务。 */
  closeMissing: boolean
  /** 为 true 时，只预演同步结果，不真正写入数据库。 */
  dryRun: boolean
}

/**
 * 本地 bd 同步命令的可注入依赖。
 */
export type TaskSyncBeadsDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
  runBdList: typeof runBdList
  hasLocalBeadsRepository: typeof hasLocalBeadsRepository
}

/**
 * 执行本地 bd 同步时的运行时上下文。
 */
export type TaskSyncBeadsContext = CliRuntimeContext<TaskSyncBeadsDependencies>
