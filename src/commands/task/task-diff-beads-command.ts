/**
 * @file src/commands/task/task-diff-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { readJsonFile } from '@infra/core/json-file.js'
import { resolveGlobalDatabasePath } from '@infra/core/paths.js'
import { bootstrapDatabase } from '@infra/db/bootstrap.js'
import { createTaskStore } from '@infra/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  RepositoryTargetNotFoundError,
  resolveManagedProject,
  resolveRepositoryTarget,
} from '@infra/project/resolve-project.js'
import {
  hasLocalBeadsRepository,
  normalizeBdIssueList,
  runBdList,
} from '@integrations/sync/beads-bd-service.js'
import {
  buildBeadsDiffPreview,
  collectDeclaredBeadsExternalTaskIds,
  buildRepositoryId,
  normalizeBeadsSnapshot,
} from '@integrations/sync/beads-import-service.js'

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
    messages.taskDiffBeads.helpDescription,
    '',
    'foxpilot task diff-beads',
    'fp task diff-beads',
    '--file <json-file>',
    '--repository <repository-selector>',
    '--all-repositories',
    '--close-missing',
    '--path <project-root>',
  ].join('\n')
}

type SingleDiffPreviewResult = {
  repositoryPath: string
  repositoryRoot: string
  preview: ReturnType<typeof buildBeadsDiffPreview>
  rejected: string[]
}

function formatDiffEntry(entry: ReturnType<typeof buildBeadsDiffPreview>['entries'][number]): string {
  if (entry.action === 'close') {
    return `- [close] ${entry.externalTaskId} ${entry.detail}`
  }

  return `- [${entry.action}] ${entry.externalTaskId} ${entry.title} | repo=${entry.repositoryPath} | ${entry.detail}`
}

async function buildSingleRepositoryLivePreview(input: {
  projectRoot: string
  projectId: string
  repositoryPath: string
  taskStore: ReturnType<typeof createTaskStore>
  runBdList: TaskDiffBeadsDependencies['runBdList']
  closeMissing: boolean
}): Promise<SingleDiffPreviewResult> {
  const repositoryRoot = path.resolve(input.projectRoot, input.repositoryPath)
  const payload = JSON.parse(await input.runBdList({ repositoryRoot })) as unknown
  const repositoryId = buildRepositoryId(input.projectRoot, input.repositoryPath)
  const normalized = normalizeBdIssueList({
    payload,
    repositoryId,
    repositoryPath: input.repositoryPath,
  })
  const preview = buildBeadsDiffPreview({
    projectId: input.projectId,
    taskStore: input.taskStore,
    normalizedRecords: normalized.accepted,
    declaredExternalIds: normalized.declaredExternalIds,
    closeMissing: input.closeMissing,
    closeMissingRepositoryId: repositoryId,
  })

  return {
    repositoryPath: input.repositoryPath,
    repositoryRoot,
    preview,
    rejected: normalized.rejected,
  }
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
  const commandName = 'task diff-beads'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.file?.trim() && !args.repository?.trim() && !args.allRepositories) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'PREVIEW_SOURCE_REQUIRED',
            message: messages.taskDiffBeads.fileRequired,
          })
        : messages.taskDiffBeads.fileRequired,
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
              message: messages.taskDiffBeads.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : `${messages.taskDiffBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
            message: messages.taskDiffBeads.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : `${messages.taskDiffBeads.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`

  if (args.file?.trim()) {
    const filePath = path.resolve(context.cwd, args.file)
    let payload
    try {
      payload = await dependencies.readJsonFile<unknown>(filePath)
    } catch (error) {
      db.close()

      if (error instanceof SyntaxError) {
        return {
          exitCode: 1,
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'INVALID_JSON',
                message: messages.taskDiffBeads.invalidJson,
                details: {
                  filePath,
                },
              })
            : `${messages.taskDiffBeads.invalidJson}\n- ${filePath}`,
        }
      }

      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'FILE_READ_FAILED',
              message: messages.taskDiffBeads.fileReadFailed,
              details: {
                filePath,
              },
            })
          : `${messages.taskDiffBeads.fileReadFailed}\n- ${filePath}`,
      }
    }

    if (!Array.isArray(payload)) {
      db.close()
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'INVALID_PAYLOAD',
              message: messages.taskDiffBeads.invalidPayload,
              details: {
                filePath,
              },
            })
          : `${messages.taskDiffBeads.invalidPayload}\n- ${filePath}`,
      }
    }

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

    const data = {
      projectRoot: managedProject.projectRoot,
      mode: 'file' as const,
      file: filePath,
      closeMissing: args.closeMissing,
      preview,
      rejected: normalized.rejected,
    }

    if (args.json) {
      return {
        exitCode: 0,
        stdout: toJsonSuccessOutput(commandName, data),
      }
    }

    const detailLines = preview.entries.length === 0
      ? [messages.taskDiffBeads.noChanges]
      : preview.entries.map(formatDiffEntry)

    return {
      exitCode: 0,
      stdout: [
        messages.taskDiffBeads.title,
        `- projectRoot: ${managedProject.projectRoot}`,
        '- mode: file',
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

  if (args.repository?.trim()) {
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
                message: messages.taskDiffBeads.repositoryNotFound,
                details: {
                  repository: error.repositorySelector,
                },
              })
            : `${messages.taskDiffBeads.repositoryNotFound}\n- repository: ${error.repositorySelector}`,
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
              code: 'PREVIEW_SOURCE_REQUIRED',
              message: messages.taskDiffBeads.fileRequired,
            })
          : messages.taskDiffBeads.fileRequired,
      }
    }

    try {
      const result = await buildSingleRepositoryLivePreview({
        projectRoot: managedProject.projectRoot,
        projectId,
        repositoryPath: repositoryTarget.path,
        taskStore,
        runBdList: dependencies.runBdList,
        closeMissing: args.closeMissing,
      })
      db.close()

      const data = {
        projectRoot: managedProject.projectRoot,
        mode: 'single-repository' as const,
        repositoryPath: result.repositoryPath,
        repositoryRoot: result.repositoryRoot,
        closeMissing: args.closeMissing,
        preview: result.preview,
        rejected: result.rejected,
      }

      if (args.json) {
        return {
          exitCode: 0,
          stdout: toJsonSuccessOutput(commandName, data),
        }
      }

      const detailLines = result.preview.entries.length === 0
        ? [messages.taskDiffBeads.noChanges]
        : result.preview.entries.map(formatDiffEntry)

      return {
        exitCode: 0,
        stdout: [
          messages.taskDiffBeads.title,
          `- projectRoot: ${managedProject.projectRoot}`,
          '- mode: single-repository',
          `- repository: ${result.repositoryPath}`,
          `- repositoryRoot: ${result.repositoryRoot}`,
          `- closeMissing: ${args.closeMissing ? 'true' : 'false'}`,
          `- created: ${result.preview.created}`,
          `- updated: ${result.preview.updated}`,
          `- skipped: ${result.preview.skipped}`,
          `- closed: ${result.preview.closed}`,
          `- rejected: ${result.rejected.length}`,
          '',
          messages.taskDiffBeads.detailsTitle,
          ...detailLines,
          ...(result.rejected.length > 0
            ? ['', messages.taskDiffBeads.rejectedTitle, ...result.rejected.map((item) => `- ${item}`)]
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
                message: messages.taskDiffBeads.invalidJson,
                details: {
                  repositoryRoot: path.resolve(managedProject.projectRoot, repositoryTarget.path),
                },
              })
            : `${messages.taskDiffBeads.invalidJson}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
        }
      }

      if (error instanceof TypeError) {
        return {
          exitCode: 1,
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'INVALID_PAYLOAD',
                message: messages.taskDiffBeads.invalidPayload,
                details: {
                  repositoryRoot: path.resolve(managedProject.projectRoot, repositoryTarget.path),
                },
              })
            : `${messages.taskDiffBeads.invalidPayload}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
        }
      }

      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'READ_FAILED',
              message: messages.taskDiffBeads.fileReadFailed,
              details: {
                repositoryRoot: path.resolve(managedProject.projectRoot, repositoryTarget.path),
              },
            })
          : `${messages.taskDiffBeads.fileReadFailed}\n- repositoryRoot: ${path.resolve(managedProject.projectRoot, repositoryTarget.path)}`,
      }
    }
  }

  const scannedRepositories = managedProject.projectConfig.repositories.length
  let previewedRepositories = 0
  let skippedRepositories = 0
  let created = 0
  let updated = 0
  let skipped = 0
  let closed = 0
  const rejected: string[] = []
  const details: string[] = []

  for (const repository of managedProject.projectConfig.repositories) {
    const repositoryRoot = path.resolve(managedProject.projectRoot, repository.path)
    const hasLocalBeads = await dependencies.hasLocalBeadsRepository({ repositoryRoot })

    if (!hasLocalBeads) {
      skippedRepositories += 1
      continue
    }

    try {
      const result = await buildSingleRepositoryLivePreview({
        projectRoot: managedProject.projectRoot,
        projectId,
        repositoryPath: repository.path,
        taskStore,
        runBdList: dependencies.runBdList,
        closeMissing: args.closeMissing,
      })
      previewedRepositories += 1
      created += result.preview.created
      updated += result.preview.updated
      skipped += result.preview.skipped
      closed += result.preview.closed
      details.push(...result.preview.entries.map(formatDiffEntry))
      rejected.push(...result.rejected.map((item) => `${repository.path}: ${item}`))
    } catch (error) {
      rejected.push(
        error instanceof SyntaxError
          ? `${repository.path}: bd list 输出不是合法 JSON`
          : error instanceof TypeError
            ? `${repository.path}: bd list 输出必须是任务数组`
            : `${repository.path}: 无法读取 bd list 输出`,
      )
    }
  }

  db.close()

  const data = {
    projectRoot: managedProject.projectRoot,
    mode: 'all-repositories' as const,
    scannedRepositories,
    previewedRepositories,
    skippedRepositories,
    closeMissing: args.closeMissing,
    preview: {
      created,
      updated,
      skipped,
      closed,
      entries: details,
    },
    rejected,
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
      messages.taskDiffBeads.title,
      `- projectRoot: ${managedProject.projectRoot}`,
      '- mode: all-repositories',
      `- scannedRepositories: ${scannedRepositories}`,
      `- previewedRepositories: ${previewedRepositories}`,
      `- skippedRepositories: ${skippedRepositories}`,
      `- closeMissing: ${args.closeMissing ? 'true' : 'false'}`,
      `- created: ${created}`,
      `- updated: ${updated}`,
      `- skipped: ${skipped}`,
      `- closed: ${closed}`,
      `- rejected: ${rejected.length}`,
      '',
      messages.taskDiffBeads.detailsTitle,
      ...(details.length > 0 ? details : [messages.taskDiffBeads.noChanges]),
      ...(rejected.length > 0
        ? ['', messages.taskDiffBeads.rejectedTitle, ...rejected.map((item) => `- ${item}`)]
        : []),
    ].join('\n'),
  }
}
