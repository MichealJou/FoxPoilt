/**
 * @file src/sync/beads-bd-service.ts
 * @author michaeljou
 */

import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import type { TaskRow } from '@foxpilot/infra/db/task-store.js'
import type { NormalizedBeadsRecord } from '@foxpilot/integrations/sync/beads-import-service.js'

const execFileAsync = promisify(execFile)

type BdIssueListRow = {
  id?: unknown
  title?: unknown
  status?: unknown
  priority?: unknown
}

/**
 * 当前通过 `bd update` 可直接回写的最小状态集合。
 *
 * FoxPilot 的内部状态更细，因此回写时要折叠到 bd 当前支持的几种主状态。
 */
export type BdWritableStatus = 'open' | 'in_progress' | 'blocked' | 'closed'

/**
 * 基于 bd CLI 标准化后的本地快照结果。
 *
 * 这里和 JSON 文件导入保持同样的双轨输出：
 * - `accepted` 进入后续落库；
 * - `rejected` 仅反馈给用户，不拖垮整批同步；
 * - `declaredExternalIds` 用于 `--close-missing` 时避免误关任务。
 */
export type NormalizeBdIssueListResult = {
  accepted: NormalizedBeadsRecord[]
  rejected: string[]
  declaredExternalIds: Set<string>
}

/**
 * 执行一次只读的 `bd list --json --all`。
 *
 * 这里显式使用 `execFile` 而不是拼 shell 字符串，原因是：
 * - 参数是固定数组，更安全；
 * - 测试中也更容易注入替代实现；
 * - 后续若需要加更多 flag，不必担心 shell 转义问题。
 */
export async function runBdList(input: {
  repositoryRoot: string
}): Promise<string> {
  const result = await execFileAsync('bd', ['list', '--json', '--all'], {
    cwd: input.repositoryRoot,
    maxBuffer: 10 * 1024 * 1024,
  })

  return result.stdout
}

/**
 * 在指定仓库内执行一次 `bd init`。
 *
 * 这条操作只负责初始化本地 `.beads` 结构，不做任何 FoxPilot 落库。
 * 命令层会先自行判断仓库是否已初始化，避免重复执行。
 */
export async function runBdInit(input: {
  repositoryRoot: string
}): Promise<void> {
  await execFileAsync('bd', ['init'], {
    cwd: input.repositoryRoot,
    maxBuffer: 10 * 1024 * 1024,
  })
}

/**
 * 判断某个仓库是否已经初始化本地 Beads 数据。
 *
 * 当前先采用最稳的最小规则：只检查 `.beads` 目录是否存在。
 * 这样可以在“同步全部仓库”时提前跳过未启用 Beads 的仓库，
 * 避免把正常的“没接入”误判成同步失败。
 */
export async function hasLocalBeadsRepository(input: {
  repositoryRoot: string
}): Promise<boolean> {
  try {
    await access(path.join(input.repositoryRoot, '.beads'))
    return true
  } catch {
    return false
  }
}

/**
 * 把 bd 的状态值折叠到 FoxPilot 当前允许的最小状态集合。
 *
 * 设计逻辑：
 * - `open` 视为尚未推进，对应 `todo`；
 * - `in_progress` 直接映射到 `executing`；
 * - `blocked` 直接映射；
 * - `closed` 视为已完成；
 * - `deferred` 当前没有单独状态位，先压缩到 `blocked`，
 *   表达“暂时不继续推进”的语义。
 */
export function mapBdStatusToTaskStatus(rawStatus: string): TaskRow['status'] | null {
  switch (rawStatus) {
    case 'open':
      return 'todo'
    case 'in_progress':
      return 'executing'
    case 'blocked':
      return 'blocked'
    case 'closed':
      return 'done'
    case 'deferred':
      return 'blocked'
    default:
      return null
  }
}

/**
 * 把 bd 的 0-4 优先级压缩到 FoxPilot 当前的 P0-P3。
 *
 * 设计逻辑：
 * - `0/1/2/3` 一一映射；
 * - `4` 说明优先级最低，当前先折叠到 `P3`；
 * - 非法值返回 `null`，交给上层记入 rejected。
 */
export function mapBdPriorityToTaskPriority(rawPriority: number): TaskRow['priority'] | null {
  switch (rawPriority) {
    case 0:
      return 'P0'
    case 1:
      return 'P1'
    case 2:
      return 'P2'
    case 3:
    case 4:
      return 'P3'
    default:
      return null
  }
}

/**
 * 把 FoxPilot 当前任务状态折叠回 bd 支持的状态值。
 *
 * 设计逻辑：
 * - `todo` 对应尚未开始，因此回写为 `open`；
 * - 分析、计划确认、执行、结果确认都属于“正在推进”，统一回写为 `in_progress`；
 * - `blocked` 保持原样；
 * - `done` 与 `cancelled` 当前都只能折叠为 `closed`。
 */
export function mapTaskStatusToBdStatus(status: TaskRow['status']): BdWritableStatus {
  switch (status) {
    case 'todo':
      return 'open'
    case 'blocked':
      return 'blocked'
    case 'done':
    case 'cancelled':
      return 'closed'
    case 'analyzing':
    case 'awaiting_plan_confirm':
    case 'executing':
    case 'awaiting_result_confirm':
      return 'in_progress'
  }
}

/**
 * 把 FoxPilot 的 P0-P3 优先级回写为 bd 的 0-3。
 *
 * 当前不生成 bd 的 4，因为 FoxPilot 现阶段没有比 P3 更低的一档。
 */
export function mapTaskPriorityToBdPriority(priority: TaskRow['priority']): 0 | 1 | 2 | 3 {
  switch (priority) {
    case 'P0':
      return 0
    case 'P1':
      return 1
    case 'P2':
      return 2
    case 'P3':
      return 3
  }
}

/**
 * 把单条已导入任务的当前快照回写到仓库内的 bd 数据库。
 *
 * 当前只回写最稳定、最容易双向对齐的几个字段：
 * - title
 * - description
 * - priority
 * - status
 *
 * 不回写 executor / task_type 等 FoxPilot 本地编排字段，避免把本地语义强行塞回 bd。
 */
export async function runBdUpdate(input: {
  repositoryRoot: string
  externalTaskId: string
  title: string
  description: string | null
  priority: 0 | 1 | 2 | 3
  status: BdWritableStatus
}): Promise<void> {
  await execFileAsync(
    'bd',
    [
      'update',
      input.externalTaskId,
      '--title',
      input.title,
      '--description',
      input.description ?? '',
      '--priority',
      String(input.priority),
      '--status',
      input.status,
    ],
    {
      cwd: input.repositoryRoot,
      maxBuffer: 10 * 1024 * 1024,
    },
  )
}

/**
 * 把 `bd list --json` 输出标准化成 FoxPilot 可直接落库的记录集合。
 *
 * 这层只处理“bd 自己的字段语义”，不再做项目仓库存在性校验，
 * 因为仓库已经由命令层在调用前显式解析完成。
 */
export function normalizeBdIssueList(input: {
  payload: unknown
  repositoryId: string
  repositoryPath: string
}): NormalizeBdIssueListResult {
  if (!Array.isArray(input.payload)) {
    throw new TypeError('bd list payload must be an array')
  }

  const accepted: NormalizedBeadsRecord[] = []
  const rejected: string[] = []
  const declaredExternalIds = new Set<string>()
  const seenExternalIds = new Set<string>()

  for (const [index, record] of input.payload.entries()) {
    const prefix = `record[${index}]`

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      rejected.push(`${prefix}: record 不是对象`)
      continue
    }

    const item = record as BdIssueListRow
    const externalTaskId = typeof item.id === 'string' ? item.id.trim() : ''
    if (!externalTaskId) {
      rejected.push(`${prefix}: id 非法或缺失`)
      continue
    }

    declaredExternalIds.add(externalTaskId)

    if (seenExternalIds.has(externalTaskId)) {
      rejected.push(`${prefix}: id 重复`)
      continue
    }

    const title = typeof item.title === 'string' ? item.title.trim() : ''
    if (!title) {
      rejected.push(`${prefix}: title 非法或缺失`)
      continue
    }

    const status = typeof item.status === 'string'
      ? mapBdStatusToTaskStatus(item.status.trim())
      : null
    if (!status) {
      rejected.push(`${prefix}: status 非法或缺失`)
      continue
    }

    const priority = typeof item.priority === 'number'
      ? mapBdPriorityToTaskPriority(item.priority)
      : null
    if (!priority) {
      rejected.push(`${prefix}: priority 非法或缺失`)
      continue
    }

    seenExternalIds.add(externalTaskId)
    accepted.push({
      externalTaskId,
      title,
      status,
      priority,
      repositoryId: input.repositoryId,
      repositoryPath: input.repositoryPath,
    })
  }

  return {
    accepted,
    rejected,
    declaredExternalIds,
  }
}
