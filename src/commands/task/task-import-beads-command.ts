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
import { createTaskStore, type TaskTargetRow } from '@/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  resolveManagedProject,
} from '@/project/resolve-project.js'
import {
  decideBeadsImportAction,
  normalizeBeadsSnapshot,
} from '@/sync/beads-import-service.js'

import type {
  TaskImportBeadsArgs,
  TaskImportBeadsContext,
  TaskImportBeadsDependencies,
} from '@/commands/task/task-import-beads-types.js'

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
  const normalized = normalizeBeadsSnapshot({
    records: payload,
    projectRoot: managedProject.projectRoot,
    projectConfig: managedProject.projectConfig,
  })
  let created = 0
  let updated = 0
  let skipped = 0

  for (const record of normalized.accepted) {
    const now = new Date().toISOString()
    const repositoryTarget: TaskTargetRow = {
      id: `task_target:${randomUUID()}`,
      task_id: '',
      repository_id: record.repositoryId,
      target_type: 'repository',
      target_value: null,
      created_at: now,
    }
    const existingTask = taskStore.getTaskByExternalRef({
      projectId,
      externalSource: 'beads',
      externalId: record.externalTaskId,
    })

    const action = decideBeadsImportAction(existingTask, record)

    if (action === 'create') {
      const taskId = `task:${randomUUID()}`

      taskStore.createTask({
        task: {
          id: taskId,
          project_id: projectId,
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

    taskStore.syncImportedTaskSnapshot({
      projectId,
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
      `- rejected: ${normalized.rejected.length}`,
      ...(normalized.rejected.length > 0
        ? ['', messages.taskImportBeads.rejectedTitle, ...normalized.rejected.map((item) => `- ${item}`)]
        : []),
    ].join('\n'),
  }
}
