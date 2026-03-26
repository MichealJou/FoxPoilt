/**
 * @file src/sync/beads-import-service.ts
 * @author michaeljou
 */

import { randomUUID } from 'node:crypto'

import type {
  ExportableBeadsTaskRow,
  ExternalTaskSnapshotRow,
  TaskRow,
  TaskTargetRow,
} from '@/db/task-store.js'
import type { createTaskStore } from '@/db/task-store.js'
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
  /** 归一化后的仓库相对路径。 */
  repositoryPath: string
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
 * 单条快照在本地任务域中的预览结果。
 *
 * 这份结构专门服务于 `task diff-beads`：
 * - `create / update / skip` 来自合法快照记录；
 * - `close` 来自 `--close-missing` 下的缺失收口候选；
 * - `detail` 只保留人类读差异真正关心的信息。
 */
export type BeadsDiffEntry =
  | {
      action: 'create' | 'update' | 'skip'
      externalTaskId: string
      title: string
      repositoryPath: string
      detail: string
    }
  | {
      action: 'close'
      externalTaskId: string
      detail: string
    }

/**
 * 整批快照和当前任务域对比后的预览结果。
 */
export type BuildBeadsDiffPreviewResult = {
  created: number
  updated: number
  skipped: number
  closed: number
  entries: BeadsDiffEntry[]
}

/**
 * 真正落库或 dry-run 后的导入结果摘要。
 *
 * 这份结果故意不关心“输入来自 JSON 文件还是 bd CLI”，
 * 只表达统一的同步结果统计。
 */
export type ApplyBeadsImportSnapshotResult = {
  created: number
  updated: number
  skipped: number
  closed: number
}

/**
 * 导出到本地快照时使用的 Beads 记录结构。
 *
 * 这里故意复用导入命令已经接受的字段名，
 * 让“导出 -> 再导入”不需要额外格式转换。
 */
export type BeadsSnapshotExportRecord = {
  /** 外部系统中的稳定任务号。 */
  externalTaskId: string
  /** 当前任务标题。 */
  title: string
  /** 导出回外部快照协议后的状态。 */
  status: 'ready' | 'doing' | 'blocked' | 'done'
  /** 当前任务优先级。 */
  priority: TaskRow['priority']
  /** 任务绑定的仓库相对路径。 */
  repository: string
}

/**
 * 本地导出快照前的转换结果。
 *
 * 导出链路也采用“尽量导、逐条拒”的策略，原因是：
 * - 本地库中可能存在被人工改坏的历史数据；
 * - 合法记录仍然值得产出；
 * - 用户需要看到哪些记录无法回写到标准快照协议。
 */
export type BuildBeadsExportSnapshotResult = {
  exported: BeadsSnapshotExportRecord[]
  rejected: string[]
}

/**
 * 从原始快照里提取所有“已经声明过”的外部任务号。
 *
 * 这里故意不要求整条记录完全合法，只要 `externalTaskId` 本身存在且可解析，
 * 就把它纳入结果集合。这样在执行 `--close-missing` 时，即使某条记录因为
 * 仓库、状态等字段不合法被拒绝，也不会误把同一外部任务当成“已消失”而关闭。
 */
export function collectDeclaredBeadsExternalTaskIds(records: unknown[]): Set<string> {
  const declaredIds = new Set<string>()

  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      continue
    }

    const item = record as BeadsSnapshotRecord
    const externalTaskId = typeof item.externalTaskId === 'string'
      ? item.externalTaskId.trim()
      : ''

    if (externalTaskId) {
      declaredIds.add(externalTaskId)
    }
  }

  return declaredIds
}

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
 * 把本地任务状态回映射成 Beads 快照可接受的状态集合。
 *
 * 设计逻辑：
 * - `todo` 直接回写为 `ready`；
 * - 所有“正在推进中的中间态”统一压缩回 `doing`，
 *   因为当前快照协议没有更细的分析/确认阶段；
 * - `blocked` / `done` 直接一一映射；
 * - `cancelled` 不属于“当前仍存在于快照中”的状态，因此返回 `null`。
 */
export function mapTaskStatusToBeadsStatus(
  taskStatus: TaskRow['status'],
): BeadsSnapshotExportRecord['status'] | null {
  switch (taskStatus) {
    case 'todo':
      return 'ready'
    case 'analyzing':
    case 'awaiting_plan_confirm':
    case 'executing':
    case 'awaiting_result_confirm':
      return 'doing'
    case 'blocked':
      return 'blocked'
    case 'done':
      return 'done'
    case 'cancelled':
      return null
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
        repositoryPath: repositoryTarget.path,
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

/**
 * 汇总“当前任务”和“下一版快照”之间到底差了哪些字段。
 *
 * 这里故意只返回字段名，不直接输出完整前后值，原因是：
 * - 当前 CLI 先追求可扫读性，不把终端输出撑得太长；
 * - 用户最先关心的是“会不会变、变哪几类字段”，不是逐字段 diff patch；
 * - 后续若需要更细输出，可以在这个函数基础上继续展开。
 */
export function collectBeadsImportChangeKeys(
  current: ExternalTaskSnapshotRow,
  next: NormalizedBeadsRecord,
): string[] {
  const changes: string[] = []

  if (current.title !== next.title) {
    changes.push('title')
  }

  if (current.status !== next.status) {
    changes.push('status')
  }

  if (current.priority !== next.priority) {
    changes.push('priority')
  }

  if (current.repository_id !== next.repositoryId) {
    changes.push('repository')
  }

  return changes
}

/**
 * 把一批已经标准化好的外部记录应用到本地任务表。
 *
 * 这层统一承载创建、更新、跳过、收口四种动作，原因是：
 * - JSON 文件导入和 bd CLI 同步本质上都是“外部快照落库”；
 * - 如果两条命令各自维护一套创建/更新逻辑，后续很容易漂移；
 * - `closeMissingRepositoryId` 让单仓库同步可以只收口当前仓库，不误伤其他仓库。
 */
export function applyBeadsImportSnapshot(input: {
  taskStore: ReturnType<typeof createTaskStore>
  projectId: string
  normalizedRecords: NormalizedBeadsRecord[]
  declaredExternalIds: Set<string>
  closeMissing: boolean
  dryRun: boolean
  closeMissingRepositoryId?: string
}): ApplyBeadsImportSnapshotResult {
  let created = 0
  let updated = 0
  let skipped = 0
  let closed = 0

  for (const record of input.normalizedRecords) {
    const now = new Date().toISOString()
    const repositoryTarget: TaskTargetRow = {
      id: `task_target:${randomUUID()}`,
      task_id: '',
      repository_id: record.repositoryId,
      target_type: 'repository',
      target_value: null,
      created_at: now,
    }
    const existingTask = input.taskStore.getTaskByExternalRef({
      projectId: input.projectId,
      externalSource: 'beads',
      externalId: record.externalTaskId,
    })
    const action = decideBeadsImportAction(existingTask, record)

    if (action === 'create') {
      if (input.dryRun) {
        created += 1
        continue
      }

      const taskId = `task:${randomUUID()}`
      input.taskStore.createTask({
        task: {
          id: taskId,
          project_id: input.projectId,
          title: record.title,
          description: null,
          source_type: 'beads_sync',
          status: record.status,
          priority: record.priority,
          task_type: 'generic',
          execution_mode: 'manual',
          requires_plan_confirm: 1,
          current_executor: 'beads',
          external_source: 'beads',
          external_id: record.externalTaskId,
          created_at: now,
          updated_at: now,
        },
        targets: [
          {
            ...repositoryTarget,
            task_id: taskId,
          },
        ],
      })

      created += 1
      continue
    }

    if (action === 'skip') {
      skipped += 1
      continue
    }

    if (input.dryRun) {
      updated += 1
      continue
    }

    input.taskStore.syncImportedTaskSnapshot({
      projectId: input.projectId,
      taskId: existingTask!.id,
      task: {
        title: record.title,
        source_type: 'beads_sync',
        status: record.status,
        priority: record.priority,
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'beads',
        external_source: 'beads',
        external_id: record.externalTaskId,
      },
      repositoryTarget: {
        ...repositoryTarget,
        task_id: existingTask!.id,
      },
      updatedAt: now,
    })
    updated += 1
  }

  if (input.closeMissing) {
    const now = new Date().toISOString()
    const openImportedTasks = input.taskStore.listOpenImportedTaskReferences({
      projectId: input.projectId,
      externalSource: 'beads',
      repositoryId: input.closeMissingRepositoryId,
    })

    for (const task of openImportedTasks) {
      if (input.declaredExternalIds.has(task.external_id)) {
        continue
      }

      if (input.dryRun) {
        closed += 1
        continue
      }

      const wasClosed = input.taskStore.updateTaskStatus({
        projectId: input.projectId,
        taskId: task.id,
        status: 'cancelled',
        updatedAt: now,
      })

      if (wasClosed) {
        closed += 1
      }
    }
  }

  return {
    created,
    updated,
    skipped,
    closed,
  }
}

/**
 * 把本地任务投影转换为可直接写盘的 Beads 快照。
 *
 * 这里不直接在命令层拼对象，是为了把协议细节放到同步层统一维护：
 * - 状态回映射规则集中在一处；
 * - 仓库缺失、状态不可导出等异常原因集中生成；
 * - 后续如果快照协议扩展字段，只需要改这里。
 */
export function buildBeadsExportSnapshot(
  rows: ExportableBeadsTaskRow[],
): BuildBeadsExportSnapshotResult {
  const exported: BeadsSnapshotExportRecord[] = []
  const rejected: string[] = []

  for (const row of rows) {
    if (!row.repository_path?.trim()) {
      rejected.push(`externalTaskId=${row.external_id}: repository 缺失`)
      continue
    }

    const status = mapTaskStatusToBeadsStatus(row.status)
    if (!status) {
      rejected.push(`externalTaskId=${row.external_id}: status 无法导出 (${row.status})`)
      continue
    }

    exported.push({
      externalTaskId: row.external_id,
      title: row.title,
      status,
      priority: row.priority,
      repository: row.repository_path,
    })
  }

  return {
    exported,
    rejected,
  }
}

/**
 * 构造一份纯只读的 Beads 快照差异预览。
 *
 * 这层复用和真实导入一致的判断规则，保证：
 * - `diff-beads` 看到的 create / update / skip；
 * - 和 `import-beads --dry-run` 的统计口径一致；
 * - 用户可以先看差异，再决定是否真的导入。
 */
export function buildBeadsDiffPreview(input: {
  projectId: string
  taskStore: ReturnType<typeof createTaskStore>
  normalizedRecords: NormalizedBeadsRecord[]
  declaredExternalIds: Set<string>
  closeMissing: boolean
}): BuildBeadsDiffPreviewResult {
  const entries: BeadsDiffEntry[] = []
  let created = 0
  let updated = 0
  let skipped = 0
  let closed = 0

  for (const record of input.normalizedRecords) {
    const existingTask = input.taskStore.getTaskByExternalRef({
      projectId: input.projectId,
      externalSource: 'beads',
      externalId: record.externalTaskId,
    })
    const action = decideBeadsImportAction(existingTask, record)

    if (action === 'create') {
      created += 1
      entries.push({
        action: 'create',
        externalTaskId: record.externalTaskId,
        title: record.title,
        repositoryPath: record.repositoryPath,
        detail: '将创建新的同步任务',
      })
      continue
    }

    if (action === 'skip') {
      skipped += 1
      entries.push({
        action: 'skip',
        externalTaskId: record.externalTaskId,
        title: record.title,
        repositoryPath: record.repositoryPath,
        detail: '与当前同步任务一致',
      })
      continue
    }

    updated += 1
    const changes = existingTask
      ? collectBeadsImportChangeKeys(existingTask, record)
      : []

    entries.push({
      action: 'update',
      externalTaskId: record.externalTaskId,
      title: record.title,
      repositoryPath: record.repositoryPath,
      detail: changes.length > 0
        ? `差异: ${changes.join(',')}`
        : '存在同步差异',
    })
  }

  if (input.closeMissing) {
    const openImportedTasks = input.taskStore.listOpenImportedTaskReferences({
      projectId: input.projectId,
      externalSource: 'beads',
    })

    for (const task of openImportedTasks) {
      if (input.declaredExternalIds.has(task.external_id)) {
        continue
      }

      closed += 1
      entries.push({
        action: 'close',
        externalTaskId: task.external_id,
        detail: '当前快照缺失，将收口为 cancelled',
      })
    }
  }

  return {
    created,
    updated,
    skipped,
    closed,
    entries,
  }
}
