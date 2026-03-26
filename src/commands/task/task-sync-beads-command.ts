/**
 * @file src/commands/task/task-sync-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import type { CliResult } from '@/commands/init/init-types.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  RepositoryTargetNotFoundError,
  resolveManagedProject,
  resolveRepositoryTarget,
} from '@/project/resolve-project.js'
import { runBdList, normalizeBdIssueList } from '@/sync/beads-bd-service.js'
import {
  applyBeadsImportSnapshot,
  buildRepositoryId,
} from '@/sync/beads-import-service.js'

import type {
  TaskSyncBeadsArgs,
  TaskSyncBeadsContext,
  TaskSyncBeadsDependencies,
} from '@/commands/task/task-sync-beads-types.js'

/**
 * 解析本地 bd 同步命令的默认依赖。
 */
function getDependencies(
  overrides: Partial<TaskSyncBeadsDependencies> = {},
): TaskSyncBeadsDependencies {
  return {
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    runBdList,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskSyncBeads.helpDescription,
    '',
    'foxpilot task sync-beads',
    'fp task sync-beads',
    '--repository <repository-selector>',
    '--close-missing',
    '--dry-run',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 从当前项目的某个仓库中直接读取 `bd list --json --all`，再同步到 FoxPilot。
 *
 * 当前刻意要求显式给出 `--repository`，原因是：
 * - 多仓库项目里自动猜测很容易选错；
 * - 单仓库同步的“缺失任务收口”必须明确作用域；
 * - 后续如果再引入远程同步模式，命令语义也更清楚。
 */
export async function runTaskSyncBeadsCommand(
  args: TaskSyncBeadsArgs,
  context: TaskSyncBeadsContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.repository?.trim()) {
    return {
      exitCode: 1,
      stdout: messages.taskSyncBeads.repositoryRequired,
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
        stdout: `${messages.taskSyncBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  let repositoryTarget
  try {
    repositoryTarget = resolveRepositoryTarget(managedProject.projectConfig, args.repository)
  } catch (error) {
    if (error instanceof RepositoryTargetNotFoundError) {
      return {
        exitCode: 1,
        stdout: `${messages.taskSyncBeads.repositoryNotFound}\n- repository: ${error.repositorySelector}`,
      }
    }

    throw error
  }

  if (!repositoryTarget) {
    return {
      exitCode: 1,
      stdout: messages.taskSyncBeads.repositoryRequired,
    }
  }

  const repositoryRoot = path.resolve(managedProject.projectRoot, repositoryTarget.path)
  let payload
  try {
    payload = JSON.parse(await dependencies.runBdList({ repositoryRoot })) as unknown
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        exitCode: 1,
        stdout: `${messages.taskSyncBeads.invalidJson}\n- repositoryRoot: ${repositoryRoot}`,
      }
    }

    return {
      exitCode: 1,
      stdout: `${messages.taskSyncBeads.readFailed}\n- repositoryRoot: ${repositoryRoot}`,
    }
  }

  let normalized
  try {
    normalized = normalizeBdIssueList({
      payload,
      repositoryId: buildRepositoryId(managedProject.projectRoot, repositoryTarget.path),
      repositoryPath: repositoryTarget.path,
    })
  } catch {
    return {
      exitCode: 1,
      stdout: `${messages.taskSyncBeads.invalidPayload}\n- repositoryRoot: ${repositoryRoot}`,
    }
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  let db
  try {
    db = await dependencies.bootstrapDatabase(dbPath)
  } catch {
    return {
      exitCode: 4,
      stdout: `${messages.taskSyncBeads.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const projectId = `project:${managedProject.projectRoot}`
  const taskStore = dependencies.createTaskStore(db)
  const importResult = applyBeadsImportSnapshot({
    taskStore,
    projectId,
    normalizedRecords: normalized.accepted,
    declaredExternalIds: normalized.declaredExternalIds,
    closeMissing: args.closeMissing,
    dryRun: args.dryRun,
    closeMissingRepositoryId: buildRepositoryId(managedProject.projectRoot, repositoryTarget.path),
  })

  db.close()

  return {
    exitCode: 0,
    stdout: [
      messages.taskSyncBeads.completed,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- repository: ${repositoryTarget.path}`,
      `- repositoryRoot: ${repositoryRoot}`,
      `- dryRun: ${args.dryRun ? 'true' : 'false'}`,
      `- created: ${importResult.created}`,
      `- updated: ${importResult.updated}`,
      `- skipped: ${importResult.skipped}`,
      `- closed: ${importResult.closed}`,
      `- rejected: ${normalized.rejected.length}`,
      ...(normalized.rejected.length > 0
        ? ['', messages.taskSyncBeads.rejectedTitle, ...normalized.rejected.map((item) => `- ${item}`)]
        : []),
    ].join('\n'),
  }
}
