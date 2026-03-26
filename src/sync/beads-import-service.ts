/**
 * @file src/sync/beads-import-service.ts
 * @author michaeljou
 */

import type { ExternalTaskSnapshotRow, TaskRow } from '@/db/task-store.js'
import type { ProjectConfig } from '@/project/project-config.js'
import {
  RepositoryTargetNotFoundError,
  resolveRepositoryTarget,
} from '@/project/resolve-project.js'

type BeadsSnapshotRecord = {
  externalTaskId?: unknown
  title?: unknown
  status?: unknown
  priority?: unknown
  repository?: unknown
}

/**
 * 通过校验后的单条 Beads 快照记录。
 *
 * 这个结构已经完成：
 * - 外部字段名到本地字段语义的映射；
 * - 状态与优先级的合法值校验；
 * - 仓库选择器到本地 repository id 的归一化。
 */
export type NormalizedBeadsRecord = {
  /** 外部系统中的稳定任务主键。 */
  externalTaskId: string
  /** 对应本地任务标题。 */
  title: string
  /** 映射后的本地任务状态。 */
  status: TaskRow['status']
  /** 映射后的本地优先级。 */
  priority: TaskRow['priority']
  /** 归一化后的本地仓库主键。 */
  repositoryId: string
}

/**
 * 一批快照标准化后的结果。
 *
 * 导入层需要同时拿到两类信息：
 * - 可继续进入创建/更新流程的合法记录；
 * - 应展示给用户的拒绝原因列表。
 */
export type NormalizeBeadsSnapshotResult = {
  accepted: NormalizedBeadsRecord[]
  rejected: string[]
}

/**
 * 导入层对当前快照的决策结果。
 */
export type BeadsImportAction = 'create' | 'update' | 'skip'

/**
 * 把项目根目录和仓库相对路径拼成稳定仓库主键。
 *
 * 这个规则必须和 `init` / `task create` / `task suggest-scan` 完全一致，
 * 否则同步任务会和 catalog 中现有仓库产生错位。
 */
export function buildRepositoryId(projectRoot: string, repositoryPath: string): string {
  return `repository:${projectRoot}:${repositoryPath}`
}

/**
 * 把 Beads 状态映射为当前任务域允许的状态集合。
 *
 * 当前只保留最小映射，不引入更复杂的中间态推断。
 */
export function mapBeadsStatus(rawStatus: string): TaskRow['status'] | null {
  switch (rawStatus) {
    case 'ready':
      return 'todo'
    case 'doing':
      return 'executing'
    case 'blocked':
      return 'blocked'
    case 'done':
      return 'done'
    default:
      return null
  }
}

/**
 * 把外部优先级映射到本地优先级集合。
 */
export function mapBeadsPriority(rawPriority: string): TaskRow['priority'] | null {
  if (rawPriority === 'P0' || rawPriority === 'P1' || rawPriority === 'P2' || rawPriority === 'P3') {
    return rawPriority
  }

  return null
}

/**
 * 标准化一批 Beads 快照记录。
 *
 * 这里采用“逐条校验、逐条拒绝”的策略，而不是遇到第一条坏记录就终止。
 * 这样更贴近真实同步场景：外部快照里总可能夹杂部分脏数据，但合法记录仍应进入系统。
 */
export function normalizeBeadsSnapshot(input: {
  records: unknown[]
  projectRoot: string
  projectConfig: ProjectConfig
}): NormalizeBeadsSnapshotResult {
  const accepted: NormalizedBeadsRecord[] = []
  const rejected: string[] = []
  const seenExternalIds = new Set<string>()

  for (const [index, record] of input.records.entries()) {
    const prefix = `record[${index}]`

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      rejected.push(`${prefix}: record 不是对象`)
      continue
    }

    const item = record as BeadsSnapshotRecord
    const externalTaskId = typeof item.externalTaskId === 'string' ? item.externalTaskId.trim() : ''
    if (!externalTaskId) {
      rejected.push(`${prefix}: externalTaskId 非法或缺失`)
      continue
    }

    if (seenExternalIds.has(externalTaskId)) {
      rejected.push(`${prefix}: externalTaskId 重复`)
      continue
    }

    const title = typeof item.title === 'string' ? item.title.trim() : ''
    if (!title) {
      rejected.push(`${prefix}: title 非法或缺失`)
      continue
    }

    const status = typeof item.status === 'string' ? mapBeadsStatus(item.status.trim()) : null
    if (!status) {
      rejected.push(`${prefix}: status 非法或缺失`)
      continue
    }

    const priority = typeof item.priority === 'string' ? mapBeadsPriority(item.priority.trim()) : null
    if (!priority) {
      rejected.push(`${prefix}: priority 非法或缺失`)
      continue
    }

    const repositorySelector = typeof item.repository === 'string' ? item.repository.trim() : ''
    if (!repositorySelector) {
      rejected.push(`${prefix}: repository 非法或缺失`)
      continue
    }

    try {
      const repositoryTarget = resolveRepositoryTarget(input.projectConfig, repositorySelector)

      if (!repositoryTarget) {
        rejected.push(`${prefix}: repository 非法或缺失`)
        continue
      }

      seenExternalIds.add(externalTaskId)
      accepted.push({
        externalTaskId,
        title,
        status,
        priority,
        repositoryId: buildRepositoryId(input.projectRoot, repositoryTarget.path),
      })
    } catch (error) {
      if (error instanceof RepositoryTargetNotFoundError) {
        rejected.push(`${prefix}: repository 不存在 (${error.repositorySelector})`)
        continue
      }

      throw error
    }
  }

  return {
    accepted,
    rejected,
  }
}

/**
 * 判断一条外部快照在当前任务表里应执行什么动作。
 *
 * 规则很直接：
 * - 没命中现有任务 -> `create`
 * - 命中且当前态完全一致 -> `skip`
 * - 命中但存在差异 -> `update`
 */
export function decideBeadsImportAction(
  current: ExternalTaskSnapshotRow | null,
  next: NormalizedBeadsRecord,
): BeadsImportAction {
  if (!current) {
    return 'create'
  }

  if (
    current.title === next.title &&
    current.status === next.status &&
    current.priority === next.priority &&
    current.task_type === 'generic' &&
    current.execution_mode === 'manual' &&
    current.requires_plan_confirm === 1 &&
    current.current_executor === 'beads' &&
    current.repository_id === next.repositoryId
  ) {
    return 'skip'
  }

  return 'update'
}
