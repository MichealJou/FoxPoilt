/**
 * @file src/commands/task/task-doctor-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  RepositoryTargetNotFoundError,
  resolveManagedProject,
  resolveRepositoryTarget,
} from '@/project/resolve-project.js'
import { hasLocalBeadsRepository, runBdList } from '@/sync/beads-bd-service.js'

import type {
  TaskDoctorBeadsArgs,
  TaskDoctorBeadsContext,
  TaskDoctorBeadsDependencies,
} from '@/commands/task/task-doctor-beads-types.js'

type DiagnosisStatus = 'ready' | 'warning' | 'error'
type DiagnosisIssue =
  | 'ok'
  | 'repository-not-initialized'
  | 'invalid-json'
  | 'invalid-payload'
  | 'read-failed'

type RepositoryDiagnosis = {
  repositoryPath: string
  repositoryRoot: string
  status: DiagnosisStatus
  issue: DiagnosisIssue
  issueCount: number
}

/**
 * 解析诊断命令的默认依赖。
 *
 * 这里只注入“项目解析、数据库探测、本地 beads 探测、bd 读取”四类能力，
 * 保持这条命令只负责体检，不承担任何同步或回写职责。
 */
function getDependencies(
  overrides: Partial<TaskDoctorBeadsDependencies> = {},
): TaskDoctorBeadsDependencies {
  return {
    resolveManagedProject,
    bootstrapDatabase,
    hasLocalBeadsRepository,
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
    messages.taskDoctorBeads.helpDescription,
    '',
    'foxpilot task doctor-beads',
    'fp task doctor-beads',
    '--repository <repository-selector>',
    '--all-repositories',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 只读诊断单个仓库的本地 Beads 环境。
 *
 * 判定规则刻意保持保守：
 * - 没有 `.beads` 目录时，视为 warning，而不是 error；
 * - `.beads` 存在但 `bd list` 无法正常返回时，视为 error；
 * - 只有能顺利读取并解析 issue 列表时，才视为 ready。
 */
async function diagnoseRepository(input: {
  projectRoot: string
  repositoryPath: string
  hasLocalBeadsRepository: TaskDoctorBeadsDependencies['hasLocalBeadsRepository']
  runBdList: TaskDoctorBeadsDependencies['runBdList']
}): Promise<RepositoryDiagnosis> {
  const repositoryRoot = path.resolve(input.projectRoot, input.repositoryPath)
  const hasLocalBeads = await input.hasLocalBeadsRepository({ repositoryRoot })

  if (!hasLocalBeads) {
    return {
      repositoryPath: input.repositoryPath,
      repositoryRoot,
      status: 'warning',
      issue: 'repository-not-initialized',
      issueCount: 0,
    }
  }

  try {
    const payload = JSON.parse(await input.runBdList({ repositoryRoot })) as unknown

    if (!Array.isArray(payload)) {
      return {
        repositoryPath: input.repositoryPath,
        repositoryRoot,
        status: 'error',
        issue: 'invalid-payload',
        issueCount: 0,
      }
    }

    return {
      repositoryPath: input.repositoryPath,
      repositoryRoot,
      status: 'ready',
      issue: 'ok',
      issueCount: payload.length,
    }
  } catch (error) {
    return {
      repositoryPath: input.repositoryPath,
      repositoryRoot,
      status: 'error',
      issue: error instanceof SyntaxError ? 'invalid-json' : 'read-failed',
      issueCount: 0,
    }
  }
}

/**
 * 组装诊断结果输出。
 *
 * 汇总块用于快速看项目整体是否可用；
 * 明细块用于定位具体哪个仓库出问题以及问题类型。
 */
function buildDiagnosisOutput(input: {
  title: string
  projectRoot: string
  mode: 'single-repository' | 'all-repositories'
  diagnoses: RepositoryDiagnosis[]
}): string {
  const readyRepositories = input.diagnoses.filter((item) => item.status === 'ready').length
  const warningRepositories = input.diagnoses.filter((item) => item.status === 'warning').length
  const errorRepositories = input.diagnoses.filter((item) => item.status === 'error').length

  return [
    input.title,
    `- projectRoot: ${input.projectRoot}`,
    `- mode: ${input.mode}`,
    `- checkedRepositories: ${input.diagnoses.length}`,
    `- readyRepositories: ${readyRepositories}`,
    `- warningRepositories: ${warningRepositories}`,
    `- errorRepositories: ${errorRepositories}`,
    '',
    ...input.diagnoses.flatMap((item) => [
      `- repository: ${item.repositoryPath}`,
      `- repositoryRoot: ${item.repositoryRoot}`,
      `- status: ${item.status}`,
      `- issue: ${item.issue}`,
      `- issueCount: ${item.issueCount}`,
      '',
    ]),
  ].join('\n').trimEnd()
}

/**
 * 诊断当前项目的本地 Beads 环境是否具备“读取 / 同步 / 回写”的最小前提。
 */
export async function runTaskDoctorBeadsCommand(
  args: TaskDoctorBeadsArgs,
  context: TaskDoctorBeadsContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task doctor-beads'

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
            message: messages.taskDoctorBeads.repositoryRequired,
          })
        : messages.taskDoctorBeads.repositoryRequired,
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
      const stdout = `${messages.taskDoctorBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskDoctorBeads.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : stdout,
      }
    }

    throw error
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  let db
  try {
    db = await dependencies.bootstrapDatabase(dbPath)
  } catch {
    const stdout = `${messages.taskDoctorBeads.dbBootstrapFailed}\n- ${dbPath}`
    return {
      exitCode: 4,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'DATABASE_BOOTSTRAP_FAILED',
            message: messages.taskDoctorBeads.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : stdout,
    }
  }
  db.close()

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
                message: messages.taskDoctorBeads.repositoryRequired,
              })
            : messages.taskDoctorBeads.repositoryRequired,
        }
      }

      repositoryPaths = [repositoryTarget.path]
    } catch (error) {
      if (error instanceof RepositoryTargetNotFoundError) {
        const stdout = `${messages.taskDoctorBeads.repositoryNotFound}\n- repository: ${error.repositorySelector}`
        return {
          exitCode: 1,
          stdout: args.json
            ? toJsonErrorOutput(commandName, {
                code: 'REPOSITORY_NOT_FOUND',
                message: messages.taskDoctorBeads.repositoryNotFound,
                details: {
                  repository: error.repositorySelector,
                },
              })
            : stdout,
        }
      }

      throw error
    }
  }

  const diagnoses = await Promise.all(
    repositoryPaths.map(async (repositoryPath) => diagnoseRepository({
      projectRoot: managedProject.projectRoot,
      repositoryPath,
      hasLocalBeadsRepository: dependencies.hasLocalBeadsRepository,
      runBdList: dependencies.runBdList,
    })),
  )

  const hasIssues = diagnoses.some((item) => item.status !== 'ready')

  if (args.json) {
    const readyRepositories = diagnoses.filter((item) => item.status === 'ready').length
    const warningRepositories = diagnoses.filter((item) => item.status === 'warning').length
    const errorRepositories = diagnoses.filter((item) => item.status === 'error').length

    return {
      exitCode: hasIssues ? 1 : 0,
      stdout: toJsonSuccessOutput(commandName, {
        projectRoot: managedProject.projectRoot,
        mode: args.allRepositories ? 'all-repositories' : 'single-repository',
        checkedRepositories: diagnoses.length,
        readyRepositories,
        warningRepositories,
        errorRepositories,
        hasIssues,
        diagnoses,
      }),
    }
  }

  return {
    exitCode: hasIssues ? 1 : 0,
    stdout: buildDiagnosisOutput({
      title: messages.taskDoctorBeads.completed,
      projectRoot: managedProject.projectRoot,
      mode: args.allRepositories ? 'all-repositories' : 'single-repository',
      diagnoses,
    }),
  }
}
