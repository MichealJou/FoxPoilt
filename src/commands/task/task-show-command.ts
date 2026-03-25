/**
 * @file src/commands/task/task-show-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore } from '@/db/task-store.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@/project/resolve-project.js'

import type { TaskShowArgs, TaskShowContext, TaskShowDependencies } from '@/commands/task/task-show-types.js'

/**
 * 解析任务详情命令使用的默认依赖集合。
 *
 * `task show` 需要同时读任务主记录和目标列表，
 * 但仍然保持“命令层不直接写 SQL”这一约束，因此把所有持久化能力都收敛到 store。
 */
function getDependencies(
  overrides: Partial<TaskShowDependencies> = {},
): TaskShowDependencies {
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
 * 详情命令只暴露最小参数集合：任务 ID 和可选项目路径。
 * 这样可以保持命令语义单一，不把筛选、格式控制等复杂度混进详情查询。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskShow.helpDescription,
    '',
    'foxpilot task show',
    'fp task show',
    '--id <task-id>',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 加载单个任务及其目标信息，供人工查看。
 *
 * 这里显式要求项目范围和任务 ID 同时命中：
 * - 避免不同项目中出现相同 taskId 前缀时发生误读；
 * - 保证“详情查看”遵守当前工作目录所属项目的隔离边界；
 * - 为未来把 taskId 设计成外部可输入值保留安全余量。
 */
export async function runTaskShowCommand(
  args: TaskShowArgs,
  context: TaskShowContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.id?.trim()) {
    return {
      exitCode: 1,
      stdout: messages.taskShow.idRequired,
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
        stdout: `${messages.taskShow.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  const db = await dependencies.bootstrapDatabase(resolveGlobalDatabasePath(context.homeDir))
  const taskStore = dependencies.createTaskStore(db)
  const detail = taskStore.getTaskDetail({
    projectId: `project:${managedProject.projectRoot}`,
    taskId: args.id.trim(),
  })

  if (!detail) {
    db.close()
    return {
      exitCode: 1,
      stdout: `${messages.taskShow.taskNotFound}\n- taskId: ${args.id.trim()}`,
    }
  }

  const targetLines =
    detail.targets.length === 0
      ? [messages.taskShow.noTargets]
      : detail.targets.map((target, index) => {
          /**
           * 输出优先级：
           * 1. 仓库目标时优先展示仓库相对路径，最贴近人类理解；
           * 2. 其次回退到目标值；
           * 3. 最后给出空占位，保证文本结构稳定。
           */
          const targetValue = target.repository_path ?? target.target_value ?? '(none)'
          return `${index + 1}. [${target.target_type}] ${targetValue}`
        })

  const taskRunLines = taskStore.listTaskRuns({
    taskId: args.id.trim(),
  })
  const runLines =
    taskRunLines.length === 0
      ? [messages.taskShow.noRuns]
      : taskRunLines.map((run, index) => {
          const timeRange = run.ended_at
            ? `${run.started_at} -> ${run.ended_at}`
            : `${run.started_at} -> (running)`
          const summary = run.summary ? ` | ${run.summary}` : ''
          return `${index + 1}. [${run.run_type}][${run.executor}][${run.status}] ${timeRange}${summary}`
        })

  db.close()

  return {
    exitCode: 0,
    stdout: [
      messages.taskShow.title,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${detail.task.id}`,
      `- title: ${detail.task.title}`,
      `- status: ${detail.task.status}`,
      `- priority: ${detail.task.priority}`,
      `- taskType: ${detail.task.task_type}`,
      `- executor: ${detail.task.current_executor}`,
      `- updatedAt: ${detail.task.updated_at}`,
      `- description: ${detail.task.description ?? ''}`,
      '',
      messages.taskShow.targetsTitle,
      ...targetLines,
      '',
      messages.taskShow.runsTitle,
      ...runLines,
    ].join('\n'),
  }
}
