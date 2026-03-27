/**
 * @file src/commands/task/task-sync-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
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
  const commandName = 'task sync-beads'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.allRepositories && !args.repository?.trim()) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'REPOSITORY_REQUIRED',
            message: messages.taskSyncBeads.repositoryRequired,
          })
        : messages.taskSyncBeads.repositoryRequired,
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
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskSyncBeads.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : `${messages.taskSyncBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'DATABASE_BOOTSTRAP_FAILED',
            message: messages.taskSyncBeads.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : `${messages.taskSyncBeads.dbBootstrapFailed}\n- ${dbPath}`,
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
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'REPOSITORY_NOT_FOUND',
                message: messages.taskSyncBeads.repositoryNotFound,
                details: {
                  repository: error.repositorySelector,
                },
              })
            : `${messages.taskSyncBeads.repositoryNotFound}\n- repository: ${error.repositorySelector}`,
        }
      }

      throw error
    }

    if (!repositoryTarget) {
      db.close()
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'REPOSITORY_REQUIRED',
              message: messages.taskSyncBeads.repositoryRequired,
            })
          : messages.taskSyncBeads.repositoryRequired,
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

      const data = {
        projectRoot: managedProject.projectRoot,
        mode: 'single-repository' as const,
        repositoryPath: result.repositoryPath,
        repositoryRoot: result.repositoryRoot,
        dryRun: args.dryRun,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        closed: result.closed,
        rejected: result.rejected,
      }

      if (args.json) {
        return {
          exitCode: 0,
          stdout: toJsonSuccessOutput(commandName, data),
        }
      }

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
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'INVALID_JSON',
                message: messages.taskSyncBeads.invalidJson,
                details: {
                  repositoryRoot: path.resolve(managedProject.projectRoot, repositoryTarget.path),
                },
              })
            : `${messages.taskSyncBeads.invalidJson}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
        }
      }

      if (error instanceof TypeError) {
        return {
          exitCode: 1,
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'INVALID_PAYLOAD',
                message: messages.taskSyncBeads.invalidPayload,
                details: {
                  repositoryRoot: path.resolve(managedProject.projectRoot, repositoryTarget.path),
                },
              })
            : `${messages.taskSyncBeads.invalidPayload}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
        }
      }

      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'READ_FAILED',
              message: messages.taskSyncBeads.readFailed,
              details: {
                repositoryRoot: path.resolve(managedProject.projectRoot, repositoryTarget.path),
              },
            })
          : `${messages.taskSyncBeads.readFailed}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
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
  const repositories: Array<{
    repositoryPath: string
    status: 'synced' | 'skipped' | 'failed'
    created: number
    updated: number
    skipped: number
    closed: number
    rejected: number
  }> = []

  for (const repository of managedProject.projectConfig.repositories) {
    const repositoryRoot = path.resolve(managedProject.projectRoot, repository.path)
    const hasLocalBeads = await dependencies.hasLocalBeadsRepository({ repositoryRoot })

    if (!hasLocalBeads) {
      skippedRepositories += 1
      repositoryDetails.push(`- ${repository.path}: skipped(no-local-beads)`)
      repositories.push({
        repositoryPath: repository.path,
        status: 'skipped',
        created: 0,
        updated: 0,
        skipped: 0,
        closed: 0,
        rejected: 0,
      })
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
      repositories.push({
        repositoryPath: repository.path,
        status: 'synced',
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        closed: result.closed,
        rejected: result.rejected.length,
      })
    } catch (error) {
      rejected.push(
        error instanceof SyntaxError
          ? `${repository.path}: bd list 输出不是合法 JSON`
          : error instanceof TypeError
            ? `${repository.path}: bd list 输出必须是任务数组`
            : `${repository.path}: 无法读取 bd list 输出`,
      )
      repositoryDetails.push(`- ${repository.path}: failed`)
      repositories.push({
        repositoryPath: repository.path,
        status: 'failed',
        created: 0,
        updated: 0,
        skipped: 0,
        closed: 0,
        rejected: 1,
      })
    }
  }

  db.close()

  const data = {
    projectRoot: managedProject.projectRoot,
    mode: 'all-repositories' as const,
    scannedRepositories,
    syncedRepositories,
    skippedRepositories,
    dryRun: args.dryRun,
    created,
    updated,
    skipped,
    closed,
    rejected,
    repositories,
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput(commandName, data),
    }
  }

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
