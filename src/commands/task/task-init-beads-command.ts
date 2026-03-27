/**
 * @file src/commands/task/task-init-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  RepositoryTargetNotFoundError,
  resolveManagedProject,
  resolveRepositoryTarget,
} from '@/project/resolve-project.js'
import { hasLocalBeadsRepository, runBdInit } from '@/sync/beads-bd-service.js'

import type {
  TaskInitBeadsArgs,
  TaskInitBeadsContext,
  TaskInitBeadsDependencies,
} from '@/commands/task/task-init-beads-types.js'

type InitRepositoryStatus = 'initialized' | 'planned' | 'skipped' | 'error'

type InitRepositoryResult = {
  repositoryPath: string
  repositoryRoot: string
  status: InitRepositoryStatus
}

/**
 * 解析本地 Beads 初始化命令的默认依赖。
 */
function getDependencies(
  overrides: Partial<TaskInitBeadsDependencies> = {},
): TaskInitBeadsDependencies {
  return {
    resolveManagedProject,
    hasLocalBeadsRepository,
    runBdInit,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskInitBeads.helpDescription,
    '',
    'foxpilot task init-beads',
    'fp task init-beads',
    '--repository <repository-selector>',
    '--all-repositories',
    '--dry-run',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 初始化单个仓库的本地 `.beads` 数据。
 *
 * 处理顺序保持保守：
 * 1. 先判断是否已经初始化；
 * 2. 已初始化则直接跳过；
 * 3. 未初始化时，`dry-run` 只返回 planned；
 * 4. 真正执行时再调用 `bd init`。
 */
async function initializeRepository(input: {
  projectRoot: string
  repositoryPath: string
  dryRun: boolean
  hasLocalBeadsRepository: TaskInitBeadsDependencies['hasLocalBeadsRepository']
  runBdInit: TaskInitBeadsDependencies['runBdInit']
}): Promise<InitRepositoryResult> {
  const repositoryRoot = path.resolve(input.projectRoot, input.repositoryPath)
  const initialized = await input.hasLocalBeadsRepository({ repositoryRoot })

  if (initialized) {
    return {
      repositoryPath: input.repositoryPath,
      repositoryRoot,
      status: 'skipped',
    }
  }

  if (input.dryRun) {
    return {
      repositoryPath: input.repositoryPath,
      repositoryRoot,
      status: 'planned',
    }
  }

  try {
    await input.runBdInit({ repositoryRoot })

    return {
      repositoryPath: input.repositoryPath,
      repositoryRoot,
      status: 'initialized',
    }
  } catch {
    return {
      repositoryPath: input.repositoryPath,
      repositoryRoot,
      status: 'error',
    }
  }
}

/**
 * 组装初始化结果输出。
 */
function buildInitOutput(input: {
  title: string
  projectRoot: string
  mode: 'single-repository' | 'all-repositories'
  dryRun: boolean
  results: InitRepositoryResult[]
}): string {
  const plannedRepositories = input.results.filter((item) => item.status === 'planned' || item.status === 'initialized').length
  const initializedRepositories = input.results.filter((item) => item.status === 'initialized').length
  const skippedRepositories = input.results.filter((item) => item.status === 'skipped').length
  const errorRepositories = input.results.filter((item) => item.status === 'error').length

  return [
    input.title,
    `- projectRoot: ${input.projectRoot}`,
    `- mode: ${input.mode}`,
    `- dryRun: ${input.dryRun ? 'true' : 'false'}`,
    `- checkedRepositories: ${input.results.length}`,
    `- plannedRepositories: ${plannedRepositories}`,
    `- initializedRepositories: ${initializedRepositories}`,
    `- skippedRepositories: ${skippedRepositories}`,
    `- errorRepositories: ${errorRepositories}`,
    '',
    ...input.results.flatMap((item) => [
      `- repository: ${item.repositoryPath}`,
      `- repositoryRoot: ${item.repositoryRoot}`,
      `- status: ${item.status}`,
      '',
    ]),
  ].join('\n').trimEnd()
}

/**
 * 为当前项目的本地仓库补齐 `.beads` 初始化。
 */
export async function runTaskInitBeadsCommand(
  args: TaskInitBeadsArgs,
  context: TaskInitBeadsContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task init-beads'

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
            message: messages.taskInitBeads.repositoryRequired,
          })
        : messages.taskInitBeads.repositoryRequired,
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
              message: messages.taskInitBeads.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : `${messages.taskInitBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  let repositoryPaths: string[]

  if (args.allRepositories) {
    repositoryPaths = managedProject.projectConfig.repositories.map((repository) => repository.path)
  } else {
    try {
      const repositoryTarget = resolveRepositoryTarget(managedProject.projectConfig, args.repository)

      if (!repositoryTarget) {
        return {
          exitCode: 1,
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'REPOSITORY_REQUIRED',
                message: messages.taskInitBeads.repositoryRequired,
              })
            : messages.taskInitBeads.repositoryRequired,
        }
      }

      repositoryPaths = [repositoryTarget.path]
    } catch (error) {
      if (error instanceof RepositoryTargetNotFoundError) {
        return {
          exitCode: 1,
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'REPOSITORY_NOT_FOUND',
                message: messages.taskInitBeads.repositoryNotFound,
                details: {
                  repository: error.repositorySelector,
                },
              })
            : `${messages.taskInitBeads.repositoryNotFound}\n- repository: ${error.repositorySelector}`,
        }
      }

      throw error
    }
  }

  const results = await Promise.all(
    repositoryPaths.map(async (repositoryPath) => initializeRepository({
      projectRoot: managedProject.projectRoot,
      repositoryPath,
      dryRun: args.dryRun,
      hasLocalBeadsRepository: dependencies.hasLocalBeadsRepository,
      runBdInit: dependencies.runBdInit,
    })),
  )

  const hasErrors = results.some((item) => item.status === 'error')

  const data = {
    projectRoot: managedProject.projectRoot,
    mode: args.allRepositories ? 'all-repositories' : 'single-repository',
    dryRun: args.dryRun,
    checkedRepositories: results.length,
    plannedRepositories: results.filter((item) => item.status === 'planned' || item.status === 'initialized').length,
    initializedRepositories: results.filter((item) => item.status === 'initialized').length,
    skippedRepositories: results.filter((item) => item.status === 'skipped').length,
    errorRepositories: results.filter((item) => item.status === 'error').length,
    results,
  }

  if (args.json) {
    return {
      exitCode: hasErrors ? 1 : 0,
      stdout: toJsonSuccessOutput(commandName, data),
    }
  }

  return {
    exitCode: hasErrors ? 1 : 0,
    stdout: buildInitOutput({
      title: messages.taskInitBeads.completed,
      projectRoot: managedProject.projectRoot,
      mode: args.allRepositories ? 'all-repositories' : 'single-repository',
      dryRun: args.dryRun,
      results,
    }),
  }
}
