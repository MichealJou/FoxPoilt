import { randomUUID } from 'node:crypto'
import path from 'node:path'

import type { CliResult } from '../init/init-types.js'
import { readGlobalConfig, GlobalConfigParseError } from '../../config/global-config.js'
import { bootstrapDatabase } from '../../db/bootstrap.js'
import { createTaskStore, type TaskTargetRow } from '../../db/task-store.js'
import { resolveGlobalDatabasePath } from '../../core/paths.js'
import {
  ProjectNotInitializedError,
  RepositoryTargetNotFoundError,
  resolveManagedProject,
  resolveRepositoryTarget,
} from '../../project/resolve-project.js'

import type { TaskCreateArgs, TaskCreateContext, TaskCreateDependencies } from './task-create-types.js'

function getDependencies(
  overrides: Partial<TaskCreateDependencies> = {},
): TaskCreateDependencies {
  return {
    readGlobalConfig,
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    ...overrides,
  }
}

function buildHelpText(): string {
  return [
    'foxpilot task create',
    'fp task create',
    '--title <title>',
    '--description <description>',
    '--path <project-root>',
    '--repository <repository-name-or-path>',
    '--priority P0|P1|P2|P3',
    '--task-type generic|frontend|backend|cross_repo|docs|init',
  ].join('\n')
}

function buildErrorOutput(title: string, detailLines: string[] = []): string {
  return [title, ...detailLines].join('\n')
}

function resolveExecutor(defaultExecutor: string): 'codex' | 'beads' | 'none' {
  if (defaultExecutor === 'codex' || defaultExecutor === 'beads') {
    return defaultExecutor
  }

  return 'none'
}

export async function runTaskCreateCommand(
  args: TaskCreateArgs,
  context: TaskCreateContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(),
    }
  }

  if (!args.title?.trim()) {
    return {
      exitCode: 1,
      stdout: buildErrorOutput('[FoxPilot] 任务创建失败: title 不能为空'),
    }
  }

  const dependencies = getDependencies(context.dependencies)

  let globalConfig
  try {
    globalConfig = await dependencies.readGlobalConfig({ homeDir: context.homeDir })
  } catch (error) {
    if (error instanceof GlobalConfigParseError) {
      return {
        exitCode: 3,
        stdout: buildErrorOutput('[FoxPilot] 任务创建失败: foxpilot.config.json 格式错误', [
          `- ${error.configPath}`,
        ]),
      }
    }

    throw error
  }

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
        stdout: buildErrorOutput('[FoxPilot] 任务创建失败: 项目尚未初始化', [
          `- projectRoot: ${path.resolve(context.cwd, args.path ?? '.')}`,
        ]),
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
        stdout: buildErrorOutput('[FoxPilot] 任务创建失败: 未找到仓库目标', [
          `- repository: ${error.repositorySelector}`,
        ]),
      }
    }

    throw error
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  const db = await dependencies.bootstrapDatabase(dbPath)
  const taskStore = dependencies.createTaskStore(db)
  const now = new Date().toISOString()
  const taskId = `task:${randomUUID()}`
  const projectId = `project:${managedProject.projectRoot}`
  const repositoryId = repositoryTarget
    ? `repository:${managedProject.projectRoot}:${repositoryTarget.path}`
    : null

  const targets: TaskTargetRow[] = repositoryTarget
    ? [
        {
          id: `task_target:${randomUUID()}`,
          task_id: taskId,
          repository_id: repositoryId,
          target_type: 'repository',
          target_value: null,
          created_at: now,
        },
      ]
    : []

  try {
    taskStore.createTask({
      task: {
        id: taskId,
        project_id: projectId,
        title: args.title.trim(),
        description: args.description?.trim() || null,
        source_type: 'manual',
        status: 'todo',
        priority: args.priority,
        task_type: args.taskType,
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: resolveExecutor(globalConfig.config.defaultExecutor),
        created_at: now,
        updated_at: now,
      },
      targets,
    })
  } catch {
    db.close()
    return {
      exitCode: 1,
      stdout: buildErrorOutput('[FoxPilot] 任务创建失败: 项目未接入全局索引', [
        `- projectRoot: ${managedProject.projectRoot}`,
      ]),
    }
  }

  db.close()

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] 已创建任务',
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${taskId}`,
      `- title: ${args.title.trim()}`,
      `- targets: ${targets.length}`,
    ].join('\n'),
  }
}
