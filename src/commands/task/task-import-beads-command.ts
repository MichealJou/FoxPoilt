/**
 * @file src/commands/task/task-import-beads-command.ts
 * @author michaeljou
 */

import { randomUUID } from 'node:crypto'
import path from 'node:path'

import type { CliResult } from '@/commands/init/init-types.js'
import { readJsonFile } from '@/core/json-file.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore, type TaskRow, type TaskTargetRow } from '@/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  RepositoryTargetNotFoundError,
  resolveManagedProject,
  resolveRepositoryTarget,
} from '@/project/resolve-project.js'

import type {
  TaskImportBeadsArgs,
  TaskImportBeadsContext,
  TaskImportBeadsDependencies,
} from '@/commands/task/task-import-beads-types.js'

type BeadsSnapshotRecord = {
  externalTaskId?: unknown
  title?: unknown
  status?: unknown
  priority?: unknown
  repository?: unknown
}

type NormalizedBeadsRecord = {
  externalTaskId: string
  title: string
  status: TaskRow['status']
  priority: TaskRow['priority']
  repositoryId: string
}

/**
 * 解析导入命令使用的默认依赖集合。
 */
function getDependencies(
  overrides: Partial<TaskImportBeadsDependencies> = {},
): TaskImportBeadsDependencies {
  return {
    readJsonFile,
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 *
 * 第一版刻意把接口收窄到最少，只允许传一个本地快照文件。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskImportBeads.helpDescription,
    '',
    'foxpilot task import-beads',
    'fp task import-beads',
    '--file <json-file>',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 把项目根目录和仓库相对路径拼成稳定仓库主键。
 *
 * 这里必须和 `init`、`task create`、`task suggest-scan` 使用完全相同的规则，
 * 否则导入任务虽然能创建，但无法和 catalog 里现有仓库正确关联。
 */
function buildRepositoryId(projectRoot: string, repositoryPath: string): string {
  return `repository:${projectRoot}:${repositoryPath}`
}

function mapBeadsStatus(rawStatus: string): TaskRow['status'] | null {
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

function mapPriority(rawPriority: string): TaskRow['priority'] | null {
  if (rawPriority === 'P0' || rawPriority === 'P1' || rawPriority === 'P2' || rawPriority === 'P3') {
    return rawPriority
  }

  return null
}

/**
 * 校验并标准化单条 Beads 快照记录。
 *
 * 这里把所有拒绝原因都收敛成字符串，而不是直接抛错，原因是：
 * - 导入命令需要“尽量导入合法记录”；
 * - 单条脏数据不应该拖垮整个快照；
 * - 用户更需要看到一份拒绝清单，而不是第一条错误就中断。
 */
function normalizeRecord(input: {
  record: unknown
  index: number
  projectRoot: string
  projectConfig: Awaited<ReturnType<typeof resolveManagedProject>>['projectConfig']
  seenExternalIds: Set<string>
}): { ok: true; value: NormalizedBeadsRecord } | { ok: false; reason: string } {
  const prefix = `record[${input.index}]`

  if (!input.record || typeof input.record !== 'object' || Array.isArray(input.record)) {
    return {
      ok: false,
      reason: `${prefix}: record 不是对象`,
    }
  }

  const record = input.record as BeadsSnapshotRecord
  const externalTaskId = typeof record.externalTaskId === 'string' ? record.externalTaskId.trim() : ''
  if (!externalTaskId) {
    return {
      ok: false,
      reason: `${prefix}: externalTaskId 非法或缺失`,
    }
  }

  if (input.seenExternalIds.has(externalTaskId)) {
    return {
      ok: false,
      reason: `${prefix}: externalTaskId 重复`,
    }
  }

  const title = typeof record.title === 'string' ? record.title.trim() : ''
  if (!title) {
    return {
      ok: false,
      reason: `${prefix}: title 非法或缺失`,
    }
  }

  const mappedStatus = typeof record.status === 'string'
    ? mapBeadsStatus(record.status.trim())
    : null
  if (!mappedStatus) {
    return {
      ok: false,
      reason: `${prefix}: status 非法或缺失`,
    }
  }

  const priority = typeof record.priority === 'string'
    ? mapPriority(record.priority.trim())
    : null
  if (!priority) {
    return {
      ok: false,
      reason: `${prefix}: priority 非法或缺失`,
    }
  }

  const repositorySelector = typeof record.repository === 'string' ? record.repository.trim() : ''
  if (!repositorySelector) {
    return {
      ok: false,
      reason: `${prefix}: repository 非法或缺失`,
    }
  }

  let repositoryTarget
  try {
    repositoryTarget = resolveRepositoryTarget(input.projectConfig, repositorySelector)
  } catch (error) {
    if (error instanceof RepositoryTargetNotFoundError) {
      return {
        ok: false,
        reason: `${prefix}: repository 不存在 (${error.repositorySelector})`,
      }
    }

    throw error
  }

  if (!repositoryTarget) {
    return {
      ok: false,
      reason: `${prefix}: repository 非法或缺失`,
    }
  }

  input.seenExternalIds.add(externalTaskId)

  return {
    ok: true,
    value: {
      externalTaskId,
      title,
      status: mappedStatus,
      priority,
      repositoryId: buildRepositoryId(input.projectRoot, repositoryTarget.path),
    },
  }
}

function isImportedSnapshotUnchanged(
  current: NonNullable<ReturnType<ReturnType<typeof createTaskStore>['getTaskByExternalRef']>>,
  next: NormalizedBeadsRecord,
): boolean {
  return (
    current.title === next.title &&
    current.status === next.status &&
    current.priority === next.priority &&
    current.task_type === 'generic' &&
    current.execution_mode === 'manual' &&
    current.requires_plan_confirm === 1 &&
    current.current_executor === 'beads' &&
    current.repository_id === next.repositoryId
  )
}

/**
 * 从本地 JSON 快照导入 Beads 任务。
 *
 * 当前语义是：
 * - 快照里合法且未出现过的外部任务 -> 创建；
 * - 命中已有导入任务且当前态有变化 -> 更新；
 * - 命中已有导入任务但当前态完全一致 -> 跳过；
 * - 单条记录字段不合法 -> 记入 rejected 清单。
 */
export async function runTaskImportBeadsCommand(
  args: TaskImportBeadsArgs,
  context: TaskImportBeadsContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.file?.trim()) {
    return {
      exitCode: 1,
      stdout: messages.taskImportBeads.fileRequired,
    }
  }

  const dependencies = getDependencies(context.dependencies)

  let managedProject
  try {
    managedProject = await dependencies.resolveManagedProject({
      cwd: context.cwd,
      projectPath: args.path,
    })
  } catch (error) {
    if (error instanceof ProjectNotInitializedError) {
      return {
        exitCode: 1,
        stdout: `${messages.taskImportBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  const filePath = path.resolve(context.cwd, args.file)
  let payload
  try {
    payload = await dependencies.readJsonFile<unknown>(filePath)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        exitCode: 1,
        stdout: `${messages.taskImportBeads.invalidJson}\n- ${filePath}`,
      }
    }

    return {
      exitCode: 1,
      stdout: `${messages.taskImportBeads.fileReadFailed}\n- ${filePath}`,
    }
  }

  if (!Array.isArray(payload)) {
    return {
      exitCode: 1,
      stdout: `${messages.taskImportBeads.invalidPayload}\n- ${filePath}`,
    }
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  let db
  try {
    db = await dependencies.bootstrapDatabase(dbPath)
  } catch {
    return {
      exitCode: 4,
      stdout: `${messages.taskImportBeads.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const seenExternalIds = new Set<string>()
  const rejected: string[] = []
  let created = 0
  let updated = 0
  let skipped = 0

  for (const [index, record] of payload.entries()) {
    const normalized = normalizeRecord({
      record,
      index,
      projectRoot: managedProject.projectRoot,
      projectConfig: managedProject.projectConfig,
      seenExternalIds,
    })

    if (!normalized.ok) {
      rejected.push(normalized.reason)
      continue
    }

    const now = new Date().toISOString()
    const repositoryTarget: TaskTargetRow = {
      id: `task_target:${randomUUID()}`,
      task_id: '',
      repository_id: normalized.value.repositoryId,
      target_type: 'repository',
      target_value: null,
      created_at: now,
    }
    const existingTask = taskStore.getTaskByExternalRef({
      projectId,
      externalSource: 'beads',
      externalId: normalized.value.externalTaskId,
    })

    if (!existingTask) {
      const taskId = `task:${randomUUID()}`

      taskStore.createTask({
        task: {
          id: taskId,
          project_id: projectId,
          title: normalized.value.title,
          description: null,
          source_type: 'beads_sync',
          status: normalized.value.status,
          priority: normalized.value.priority,
          task_type: 'generic',
          execution_mode: 'manual',
          requires_plan_confirm: 1,
          current_executor: 'beads',
          external_source: 'beads',
          external_id: normalized.value.externalTaskId,
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

    if (isImportedSnapshotUnchanged(existingTask, normalized.value)) {
      skipped += 1
      continue
    }

    taskStore.syncImportedTaskSnapshot({
      projectId,
      taskId: existingTask.id,
      task: {
        title: normalized.value.title,
        source_type: 'beads_sync',
        status: normalized.value.status,
        priority: normalized.value.priority,
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'beads',
        external_source: 'beads',
        external_id: normalized.value.externalTaskId,
      },
      repositoryTarget: {
        ...repositoryTarget,
        task_id: existingTask.id,
      },
      updatedAt: now,
    })
    updated += 1
  }

  db.close()

  return {
    exitCode: 0,
    stdout: [
      messages.taskImportBeads.completed,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- file: ${filePath}`,
      `- created: ${created}`,
      `- updated: ${updated}`,
      `- skipped: ${skipped}`,
      `- rejected: ${rejected.length}`,
      ...(rejected.length > 0
        ? ['', messages.taskImportBeads.rejectedTitle, ...rejected.map((item) => `- ${item}`)]
        : []),
    ].join('\n'),
  }
}
