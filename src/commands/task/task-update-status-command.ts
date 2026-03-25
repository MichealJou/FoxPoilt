/**
 * @file src/commands/task/task-update-status-command.ts
 * @author michaeljou
 */

import { randomUUID } from 'node:crypto'

import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { createTaskStore, type TaskRunRow } from '@/db/task-store.js'
import { resolveGlobalDatabasePath } from '@/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@/project/resolve-project.js'

import type {
  TaskUpdateStatusArgs,
  TaskUpdateStatusContext,
  TaskUpdateStatusDependencies,
} from '@/commands/task/task-update-status-types.js'

/**
 * 解析任务状态更新命令使用的默认依赖集合。
 *
 * 状态更新命令虽然是写操作，但仍然只做三件事：
 * - 解析项目范围；
 * - 校验目标任务是否存在；
 * - 调用 store 持久化状态。
 * 这样后续无论接入状态机校验还是 task_run 记录，都可以先落在 store 层扩展。
 */
function getDependencies(
  overrides: Partial<TaskUpdateStatusDependencies> = {},
): TaskUpdateStatusDependencies {
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
 * 这里把完整状态集合直接写进帮助页，是为了把“允许写入的状态空间”
 * 暴露给终端调用者，避免他们猜测缩写或自造状态值。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskUpdateStatus.helpDescription,
    '',
    'foxpilot task update-status',
    'fp task update-status',
    '--id <task-id>',
    '--status todo|analyzing|awaiting_plan_confirm|executing|awaiting_result_confirm|done|blocked|cancelled',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 构造新的运行历史记录。
 *
 * 历史记录主键采用和其余表一致的文本主键策略，避免把自增主键语义混进业务层。
 */
function buildTaskRun(
  taskId: string,
  runType: TaskRunRow['run_type'],
  startedAt: string,
): TaskRunRow {
  return {
    id: `task_run:${randomUUID()}`,
    task_id: taskId,
    run_type: runType,
    executor: 'manual',
    status: 'running',
    summary: null,
    started_at: startedAt,
    ended_at: null,
    created_at: startedAt,
  }
}

/**
 * 把任务状态推进同步到 `task_run` 历史。
 *
 * 第一版只实现最小、可解释的映射规则，不在这里引入复杂状态机。
 */
function syncTaskRunHistory(
  taskStore: ReturnType<typeof createTaskStore>,
  taskId: string,
  nextStatus: TaskUpdateStatusArgs['status'],
  timestamp: string,
): void {
  switch (nextStatus) {
    case 'analyzing':
      taskStore.startTaskRun({
        run: buildTaskRun(taskId, 'analysis', timestamp),
      })
      return
    case 'awaiting_plan_confirm':
      taskStore.finishLatestTaskRun({
        taskId,
        runType: 'analysis',
        status: 'success',
        endedAt: timestamp,
      })
      return
    case 'executing':
      taskStore.startTaskRun({
        run: buildTaskRun(taskId, 'execution', timestamp),
      })
      return
    case 'awaiting_result_confirm':
      taskStore.finishLatestTaskRun({
        taskId,
        runType: 'execution',
        status: 'success',
        endedAt: timestamp,
      })
      taskStore.startTaskRun({
        run: buildTaskRun(taskId, 'verification', timestamp),
      })
      return
    case 'done': {
      const closedVerification = taskStore.finishLatestTaskRun({
        taskId,
        runType: 'verification',
        status: 'success',
        endedAt: timestamp,
      })

      if (!closedVerification) {
        taskStore.finishLatestTaskRun({
          taskId,
          runType: 'execution',
          status: 'success',
          endedAt: timestamp,
        })
      }
      return
    }
    case 'blocked':
      taskStore.finishLatestTaskRun({
        taskId,
        status: 'failed',
        endedAt: timestamp,
      })
      return
    case 'cancelled':
      taskStore.finishLatestTaskRun({
        taskId,
        status: 'cancelled',
        endedAt: timestamp,
      })
      return
    default:
      return
  }
}

/**
 * 更新当前项目范围内某个任务的持久化状态。
 *
 * MVP 阶段这里做的是“直接状态更新 + 最小历史补记”：
 * - 不记录原因说明；
 * - 只记录最小可解释的 `task_run` 历史；
 * - 不做复杂合法流转校验。
 *
 * 这样做不是最终形态，而是为了先把人工任务管理闭环跑通。
 * 等 `task_run` 和更严格的状态机落地后，再把这里收口成受约束的流转入口。
 */
export async function runTaskUpdateStatusCommand(
  args: TaskUpdateStatusArgs,
  context: TaskUpdateStatusContext,
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
      stdout: messages.taskUpdateStatus.idRequired,
    }
  }

  if (!args.status) {
    return {
      exitCode: 1,
      stdout: messages.taskUpdateStatus.statusRequired,
    }
  }

  const taskId = args.id.trim()
  const nextStatus = args.status

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
        stdout: `${messages.taskUpdateStatus.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  let db
  try {
    db = await dependencies.bootstrapDatabase(resolveGlobalDatabasePath(context.homeDir))
  } catch {
    return {
      exitCode: 4,
      stdout: `${messages.taskUpdateStatus.dbBootstrapFailed}\n- ${resolveGlobalDatabasePath(context.homeDir)}`,
    }
  }
  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  /**
   * 先查再写，而不是直接执行 update，有两个目的：
   * 1. 输出里要展示 from -> to，必须先拿到旧状态；
   * 2. 可以把“不存在”与“更新失败”区分开来，避免用户看到模糊错误。
   */
  const existingTask = taskStore.getTaskById({
    projectId,
    taskId,
  })

  if (!existingTask) {
    db.close()
    return {
      exitCode: 1,
      stdout: `${messages.taskUpdateStatus.taskNotFound}\n- taskId: ${taskId}`,
    }
  }

  const updatedAt = new Date().toISOString()
  /**
   * 当前态和历史态必须同事务更新，避免 `task` 与 `task_run` 数据脱节。
   */
  const updated = db.transaction(() => {
    const statusUpdated = taskStore.updateTaskStatus({
      projectId,
      taskId,
      status: nextStatus,
      updatedAt,
    })

    if (!statusUpdated) {
      return false
    }

    syncTaskRunHistory(taskStore, taskId, nextStatus, updatedAt)
    return true
  })()

  db.close()

  if (!updated) {
    return {
      exitCode: 1,
      stdout: `${messages.taskUpdateStatus.taskNotFound}\n- taskId: ${taskId}`,
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskUpdateStatus.updated,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${taskId}`,
      `- from: ${existingTask.status}`,
      `- to: ${nextStatus}`,
    ].join('\n'),
  }
}
