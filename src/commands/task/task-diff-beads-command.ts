/**
 * @file src/commands/task/task-diff-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import type { CliResult } from '@/commands/init/init-types.js'
import { readJsonFile } from '@/core/json-file.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  resolveManagedProject,
} from '@/project/resolve-project.js'
import {
  buildBeadsDiffPreview,
  collectDeclaredBeadsExternalTaskIds,
  normalizeBeadsSnapshot,
} from '@/sync/beads-import-service.js'

import type {
  TaskDiffBeadsArgs,
  TaskDiffBeadsContext,
  TaskDiffBeadsDependencies,
} from '@/commands/task/task-diff-beads-types.js'

/**
 * 解析差异预览命令使用的默认依赖集合。
 */
function getDependencies(
  overrides: Partial<TaskDiffBeadsDependencies> = {},
): TaskDiffBeadsDependencies {
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
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskDiffBeads.helpDescription,
    '',
    'foxpilot task diff-beads',
    'fp task diff-beads',
    '--file <json-file>',
    '--close-missing',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 预览本地 Beads 快照导入后会产生的差异。
 *
 * 设计逻辑：
 * - 这条命令完全只读，不会落库；
 * - 预览结果复用真实导入相同的校验与幂等决策；
 * - 这样用户看到的 create / update / skip / close，和后续真正执行时是一致的。
 */
export async function runTaskDiffBeadsCommand(
  args: TaskDiffBeadsArgs,
  context: TaskDiffBeadsContext,
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
      stdout: messages.taskDiffBeads.fileRequired,
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
        stdout: `${messages.taskDiffBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
        stdout: `${messages.taskDiffBeads.invalidJson}\n- ${filePath}`,
      }
    }

    return {
      exitCode: 1,
      stdout: `${messages.taskDiffBeads.fileReadFailed}\n- ${filePath}`,
    }
  }

  if (!Array.isArray(payload)) {
    return {
      exitCode: 1,
      stdout: `${messages.taskDiffBeads.invalidPayload}\n- ${filePath}`,
    }
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  let db
  try {
    db = await dependencies.bootstrapDatabase(dbPath)
  } catch {
    return {
      exitCode: 4,
      stdout: `${messages.taskDiffBeads.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const declaredExternalIds = collectDeclaredBeadsExternalTaskIds(payload)
  const normalized = normalizeBeadsSnapshot({
    records: payload,
    projectRoot: managedProject.projectRoot,
    projectConfig: managedProject.projectConfig,
  })
  const preview = buildBeadsDiffPreview({
    projectId,
    taskStore,
    normalizedRecords: normalized.accepted,
    declaredExternalIds,
    closeMissing: args.closeMissing,
  })
  db.close()

  const detailLines = preview.entries.length === 0
    ? [messages.taskDiffBeads.noChanges]
    : preview.entries.map((entry) => {
        if (entry.action === 'close') {
          return `- [close] ${entry.externalTaskId} ${entry.detail}`
        }

        return `- [${entry.action}] ${entry.externalTaskId} ${entry.title} | repo=${entry.repositoryPath} | ${entry.detail}`
      })

  return {
    exitCode: 0,
    stdout: [
      messages.taskDiffBeads.title,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- file: ${filePath}`,
      `- closeMissing: ${args.closeMissing ? 'true' : 'false'}`,
      `- created: ${preview.created}`,
      `- updated: ${preview.updated}`,
      `- skipped: ${preview.skipped}`,
      `- closed: ${preview.closed}`,
      `- rejected: ${normalized.rejected.length}`,
      '',
      messages.taskDiffBeads.detailsTitle,
      ...detailLines,
      ...(normalized.rejected.length > 0
        ? ['', messages.taskDiffBeads.rejectedTitle, ...normalized.rejected.map((item) => `- ${item}`)]
        : []),
    ].join('\n'),
  }
}
