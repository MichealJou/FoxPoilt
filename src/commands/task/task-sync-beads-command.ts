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
import {
  hasLocalBeadsRepository,
  normalizeBdIssueList,
  runBdList,
} from '@/sync/beads-bd-service.js'
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
    hasLocalBeadsRepository,
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
    '--all-repositories',
    '--close-missing',
    '--dry-run',
    '--path <project-root>',
  ].join('\n')
}

type SyncSingleRepositoryResult = {
  repositoryPath: string
  repositoryRoot: string
  created: number
  updated: number
  skipped: number
  closed: number
  rejected: string[]
}

async function syncSingleRepository(input: {
  projectRoot: string
  projectId: string
  repositoryPath: string
  taskStore: ReturnType<typeof createTaskStore>
  runBdList: TaskSyncBeadsDependencies['runBdList']
  closeMissing: boolean
  dryRun: boolean
}): Promise<SyncSingleRepositoryResult> {
  const repositoryRoot = path.resolve(input.projectRoot, input.repositoryPath)
  const repositoryId = buildRepositoryId(input.projectRoot, input.repositoryPath)
  const payload = JSON.parse(await input.runBdList({ repositoryRoot })) as unknown
  const normalized = normalizeBdIssueList({
    payload,
    repositoryId,
    repositoryPath: input.repositoryPath,
  })
  const importResult = applyBeadsImportSnapshot({
    taskStore: input.taskStore,
    projectId: input.projectId,
    normalizedRecords: normalized.accepted,
    declaredExternalIds: normalized.declaredExternalIds,
    closeMissing: input.closeMissing,
    dryRun: input.dryRun,
    closeMissingRepositoryId: repositoryId,
  })

  return {
    repositoryPath: input.repositoryPath,
    repositoryRoot,
    created: importResult.created,
    updated: importResult.updated,
    skipped: importResult.skipped,
    closed: importResult.closed,
    rejected: normalized.rejected,
  }
}

/**
 * 从当前项目的某个仓库中直接读取 `bd list --json --all`，再同步到 FoxPilot。
 *
 * 当前支持两种模式：
 * - 指定 `--repository`，同步单个仓库；
 * - 指定 `--all-repositories`，批量同步项目内所有已初始化本地 Beads 的仓库。
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

  if (!args.allRepositories && !args.repository?.trim()) {
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

  if (!args.allRepositories) {
    let repositoryTarget
    try {
      repositoryTarget = resolveRepositoryTarget(managedProject.projectConfig, args.repository)
    } catch (error) {
      db.close()

      if (error instanceof RepositoryTargetNotFoundError) {
        return {
          exitCode: 1,
          stdout: `${messages.taskSyncBeads.repositoryNotFound}\n- repository: ${error.repositorySelector}`,
        }
      }

      throw error
    }

    if (!repositoryTarget) {
      db.close()
      return {
        exitCode: 1,
        stdout: messages.taskSyncBeads.repositoryRequired,
      }
    }

    try {
      const result = await syncSingleRepository({
        projectRoot: managedProject.projectRoot,
        projectId,
        repositoryPath: repositoryTarget.path,
        taskStore,
        runBdList: dependencies.runBdList,
        closeMissing: args.closeMissing,
        dryRun: args.dryRun,
      })

      db.close()

      return {
        exitCode: 0,
        stdout: [
          messages.taskSyncBeads.completed,
          `- projectRoot: ${managedProject.projectRoot}`,
          `- mode: single-repository`,
          `- repository: ${result.repositoryPath}`,
          `- repositoryRoot: ${result.repositoryRoot}`,
          `- dryRun: ${args.dryRun ? 'true' : 'false'}`,
          `- created: ${result.created}`,
          `- updated: ${result.updated}`,
          `- skipped: ${result.skipped}`,
          `- closed: ${result.closed}`,
          `- rejected: ${result.rejected.length}`,
          ...(result.rejected.length > 0
            ? ['', messages.taskSyncBeads.rejectedTitle, ...result.rejected.map((item) => `- ${item}`)]
            : []),
        ].join('\n'),
      }
    } catch (error) {
      db.close()

      if (error instanceof SyntaxError) {
        return {
          exitCode: 1,
          stdout: `${messages.taskSyncBeads.invalidJson}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
        }
      }

      if (error instanceof TypeError) {
        return {
          exitCode: 1,
          stdout: `${messages.taskSyncBeads.invalidPayload}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
        }
      }

      return {
        exitCode: 1,
        stdout: `${messages.taskSyncBeads.readFailed}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
      }
    }
  }

  const scannedRepositories = managedProject.projectConfig.repositories.length
  let syncedRepositories = 0
  let skippedRepositories = 0
  let created = 0
  let updated = 0
  let skipped = 0
  let closed = 0
  const rejected: string[] = []
  const repositoryDetails: string[] = []

  for (const repository of managedProject.projectConfig.repositories) {
    const repositoryRoot = path.resolve(managedProject.projectRoot, repository.path)
    const hasLocalBeads = await dependencies.hasLocalBeadsRepository({ repositoryRoot })

    if (!hasLocalBeads) {
      skippedRepositories += 1
      repositoryDetails.push(`- ${repository.path}: skipped(no-local-beads)`)
      continue
    }

    try {
      const result = await syncSingleRepository({
        projectRoot: managedProject.projectRoot,
        projectId,
        repositoryPath: repository.path,
        taskStore,
        runBdList: dependencies.runBdList,
        closeMissing: args.closeMissing,
        dryRun: args.dryRun,
      })

      syncedRepositories += 1
      created += result.created
      updated += result.updated
      skipped += result.skipped
      closed += result.closed
      rejected.push(...result.rejected.map((item) => `${repository.path}: ${item}`))
      repositoryDetails.push(
        `- ${repository.path}: created=${result.created} updated=${result.updated} skipped=${result.skipped} closed=${result.closed} rejected=${result.rejected.length}`,
      )
    } catch (error) {
      rejected.push(
        error instanceof SyntaxError
          ? `${repository.path}: bd list 输出不是合法 JSON`
          : error instanceof TypeError
            ? `${repository.path}: bd list 输出必须是任务数组`
            : `${repository.path}: 无法读取 bd list 输出`,
      )
      repositoryDetails.push(`- ${repository.path}: failed`)
    }
  }

  db.close()

  return {
    exitCode: 0,
    stdout: [
      messages.taskSyncBeads.completed,
      `- projectRoot: ${managedProject.projectRoot}`,
      '- mode: all-repositories',
      `- scannedRepositories: ${scannedRepositories}`,
      `- syncedRepositories: ${syncedRepositories}`,
      `- skippedRepositories: ${skippedRepositories}`,
      `- dryRun: ${args.dryRun ? 'true' : 'false'}`,
      `- created: ${created}`,
      `- updated: ${updated}`,
      `- skipped: ${skipped}`,
      `- closed: ${closed}`,
      `- rejected: ${rejected.length}`,
      '',
      '[FoxPilot] 仓库明细',
      ...repositoryDetails,
      ...(rejected.length > 0
        ? ['', messages.taskSyncBeads.rejectedTitle, ...rejected.map((item) => `- ${item}`)]
        : []),
    ].join('\n'),
  }
}
