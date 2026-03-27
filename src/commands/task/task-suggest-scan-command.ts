/**
 * @file src/commands/task/task-suggest-scan-command.ts
 * @author michaeljou
 */

import { randomUUID } from 'node:crypto'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@foxpilot/infra/db/bootstrap.js'
import { createTaskStore } from '@foxpilot/infra/db/task-store.js'
import { resolveGlobalDatabasePath } from '@foxpilot/infra/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  resolveManagedProject,
} from '@foxpilot/infra/project/resolve-project.js'

import type {
  TaskSuggestScanArgs,
  TaskSuggestScanContext,
  TaskSuggestScanDependencies,
} from '@/commands/task/task-suggest-scan-types.js'

/**
 * 解析扫描建议命令使用的默认依赖集合。
 *
 * 这一版命令只依赖项目解析和任务仓储，不重新扫描文件系统。
 */
function getDependencies(
  overrides: Partial<TaskSuggestScanDependencies> = {},
): TaskSuggestScanDependencies {
  return {
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 *
 * 该命令不接受额外筛选参数，避免第一版把策略复杂度带进接口层。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskSuggestScan.helpDescription,
    '',
    'foxpilot task suggest-scan',
    'fp task suggest-scan',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 按“项目根目录 + 仓库相对路径”构造仓库主键。
 *
 * 这个规则必须和 init 写入 catalog 时保持一致，否则建议任务无法关联到现有仓库。
 */
function buildRepositoryId(projectRoot: string, repositoryPath: string): string {
  return `repository:${projectRoot}:${repositoryPath}`
}

/**
 * 基于当前项目已登记的仓库列表，补齐缺失的扫描建议任务。
 *
 * 这一版保持保守：
 * - 不重新扫描目录；
 * - 不自动关闭旧建议；
 * - 只做“按仓库去重后的建议任务生成”。
 */
export async function runTaskSuggestScanCommand(
  args: TaskSuggestScanArgs,
  context: TaskSuggestScanContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task suggest-scan'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
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
              message: messages.taskSuggestScan.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : `${messages.taskSuggestScan.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
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
            message: messages.taskSuggestScan.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : `${messages.taskSuggestScan.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const openRepositoryIds = new Set(
    taskStore.listOpenScanSuggestionRepositoryIds({
      projectId,
    }),
  )
  const now = new Date().toISOString()
  let created = 0
  let skipped = 0

  for (const repository of managedProject.projectConfig.repositories) {
    const repositoryId = buildRepositoryId(managedProject.projectRoot, repository.path)

    if (openRepositoryIds.has(repositoryId)) {
      skipped += 1
      continue
    }

    const taskId = `task:${randomUUID()}`

    taskStore.createTask({
      task: {
        id: taskId,
        project_id: projectId,
        title: messages.taskSuggestScan.taskTitle(repository.name),
        description: null,
        source_type: 'scan_suggestion',
        status: 'todo',
        priority: 'P2',
        task_type: 'init',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'none',
        created_at: now,
        updated_at: now,
      },
      targets: [
        {
          id: `task_target:${randomUUID()}`,
          task_id: taskId,
          repository_id: repositoryId,
          target_type: 'repository',
          target_value: null,
          created_at: now,
        },
      ],
    })

    created += 1
  }

  db.close()

  const data = {
    projectRoot: managedProject.projectRoot,
    created,
    skipped,
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
      messages.taskSuggestScan.created,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- created: ${created}`,
      `- skipped: ${skipped}`,
    ].join('\n'),
  }
}
