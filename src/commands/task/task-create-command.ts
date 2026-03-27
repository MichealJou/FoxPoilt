/**
 * @file src/commands/task/task-create-command.ts
 * @author michaeljou
 */

import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { readGlobalConfig, GlobalConfigParseError } from '@/config/global-config.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore, type TaskTargetRow } from '@/db/task-store.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  RepositoryTargetNotFoundError,
  resolveManagedProject,
  resolveRepositoryTarget,
} from '@/project/resolve-project.js'

import type { TaskCreateArgs, TaskCreateContext, TaskCreateDependencies } from '@/commands/task/task-create-types.js'

/**
 * 解析任务创建命令使用的默认依赖集合。
 *
 * 这里保留依赖注入入口，是为了让命令层保持“纯编排”职责：
 * 1. 生产环境走真实文件系统和数据库实现；
 * 2. 测试环境可以替换为故障注入或内存桩；
 * 3. 命令文件本身只负责参数校验、错误映射和输出格式。
 */
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

/**
 * 构造帮助文本。
 *
 * 帮助内容仍然使用固定参数名，因为参数名本身属于 CLI 协议的一部分；
 * 只翻译“说明文字”，不翻译 flag 名称，可以避免不同语言下命令写法不一致。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskCreate.helpDescription,
    '',
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

/**
 * 统一拼装错误输出。
 *
 * 当前 CLI 仍采用纯文本输出，所以这里约定：
 * - 第一行给出面向人的主错误信息；
 * - 后续各行提供结构化上下文，方便复制到日志或 issue 中排查。
 */
function buildErrorOutput(title: string, detailLines: string[] = []): string {
  return [title, ...detailLines].join('\n')
}

/**
 * 将全局配置中的默认执行器映射为任务表允许落库的枚举值。
 *
 * 设计上任务创建不会因为全局默认执行器不合法而整体失败，
 * 而是回退到 `none`。这样可以保证：
 * 1. 历史配置损坏时，任务仍能创建；
 * 2. 任务执行责任可以在后续流程中再人工修正；
 * 3. `task` 表里的 `current_executor` 始终满足约束，不写入脏值。
 */
function resolveExecutor(defaultExecutor: string): 'codex' | 'beads' | 'none' {
  if (defaultExecutor === 'codex' || defaultExecutor === 'beads') {
    return defaultExecutor
  }

  return 'none'
}

/**
 * 为当前受管项目创建一个手动任务。
 *
 * 这条命令的职责边界很明确：
 * - 它只创建“当前态任务记录”和可选的目标记录；
 * - 不负责启动执行流，也不负责生成 `task_run` 历史；
 * - 不直接依赖项目内配置文件内容之外的业务状态。
 *
 * 创建顺序采用“先解析项目，再引导数据库，最后一次性落库”：
 * 1. 先确认项目和仓库目标是否合法，避免无意义打开数据库；
 * 2. 再确保数据库就绪，拿到 task store；
 * 3. 最后用一次事务写入任务和目标，保证任务与目标不会半写入。
 */
export async function runTaskCreateCommand(
  args: TaskCreateArgs,
  context: TaskCreateContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task create'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.title?.trim()) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'TITLE_REQUIRED',
            message: messages.taskCreate.titleRequired,
          })
        : buildErrorOutput(messages.taskCreate.titleRequired),
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
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'MALFORMED_GLOBAL_CONFIG',
              message: messages.taskCreate.malformedGlobalConfig,
              details: {
                configPath: error.configPath,
              },
            })
          : buildErrorOutput(messages.taskCreate.malformedGlobalConfig, [
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
      const projectRoot = path.resolve(context.cwd, args.path ?? '.')
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskCreate.projectNotInitialized,
              details: {
                projectRoot,
              },
            })
          : buildErrorOutput(messages.taskCreate.projectNotInitialized, [
              `- projectRoot: ${projectRoot}`,
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
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'REPOSITORY_NOT_FOUND',
              message: messages.taskCreate.repositoryNotFound,
              details: {
                repository: error.repositorySelector,
              },
            })
          : buildErrorOutput(messages.taskCreate.repositoryNotFound, [
              `- repository: ${error.repositorySelector}`,
            ]),
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
            message: messages.taskCreate.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : buildErrorOutput(messages.taskCreate.dbBootstrapFailed, [`- ${dbPath}`]),
    }
  }
  const taskStore = dependencies.createTaskStore(db)
  const now = new Date().toISOString()
  const taskId = `task:${randomUUID()}`
  const projectId = `project:${managedProject.projectRoot}`
  /**
   * `repositoryId` 使用“项目根目录 + 仓库相对路径”拼装，是为了保证：
   * - 同一个工作区下不同项目不会撞库；
   * - 项目目录移动后 ID 语义仍然可解释；
   * - 数据库层无需再单独查一次仓库主键映射。
   */
  const repositoryId = repositoryTarget
    ? `repository:${managedProject.projectRoot}:${repositoryTarget.path}`
    : null

  /**
   * 当前 MVP 只支持“仓库级”目标。
   *
   * 如果用户没有传 `--repository`，就创建零目标任务，表示这是一个
   * 面向整个项目的泛任务；后续如果要支持文件、模块、工单等更细粒度目标，
   * 会继续沿用 `task_target` 这一层扩展，而不是修改 `task` 主表结构。
   */
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
        /** 标题是任务列表的主展示字段，也是人工检索的首要入口。 */
        title: args.title.trim(),
        description: args.description?.trim() || null,
        /** 当前入口是人工创建，所以来源固定为 `manual`。 */
        source_type: 'manual',
        /** 新建任务一律从 `todo` 起步，避免 CLI 直接跳过待处理阶段。 */
        status: 'todo',
        priority: args.priority,
        task_type: args.taskType,
        /** `task create` 只登记任务，不直接触发自动执行。 */
        execution_mode: 'manual',
        /** 计划确认在 MVP 中默认开启，避免刚创建就进入无人确认的执行。 */
        requires_plan_confirm: 1,
        current_executor: resolveExecutor(globalConfig.config.defaultExecutor),
        created_at: now,
        updated_at: now,
      },
      targets,
    })
  } catch {
    /**
     * 这里把数据库异常统一映射成“项目未建索引”，是刻意保守处理：
     * 对命令调用者来说，最常见且可操作的原因就是 catalog 尚未建立；
     * 更细的数据库错误会在后续需要调试时再往外暴露。
     */
    db.close()
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'PROJECT_NOT_INDEXED',
            message: messages.taskCreate.projectNotIndexed,
            details: {
              projectRoot: managedProject.projectRoot,
            },
          })
        : buildErrorOutput(messages.taskCreate.projectNotIndexed, [
            `- projectRoot: ${managedProject.projectRoot}`,
          ]),
    }
  }

  db.close()

  const data = {
    projectRoot: managedProject.projectRoot,
    task: {
      taskId,
      title: args.title.trim(),
      description: args.description?.trim() || null,
      source: 'manual' as const,
      status: 'todo' as const,
      priority: args.priority,
      taskType: args.taskType,
      executor: resolveExecutor(globalConfig.config.defaultExecutor),
    },
    targets: repositoryTarget
      ? [
          {
            targetType: 'repository' as const,
            repositoryPath: repositoryTarget.path,
          },
        ]
      : [],
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
      messages.taskCreate.created,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${taskId}`,
      `- title: ${args.title.trim()}`,
      `- targets: ${targets.length}`,
    ].join('\n'),
  }
}
