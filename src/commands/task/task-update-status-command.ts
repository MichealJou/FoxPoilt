/**
 * @file src/commands/task/task-update-status-command.ts
 * @author michaeljou
 */

import { randomUUID } from 'node:crypto'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { bootstrapDatabase } from '@infra/db/bootstrap.js'
import { createTaskStore, type TaskRunRow } from '@infra/db/task-store.js'
import { resolveGlobalDatabasePath } from '@infra/core/paths.js'
import { getMessages } from '@/i18n/messages.js'
import { resolveTaskReference } from '@/commands/task/task-reference.js'
import { ProjectNotInitializedError, resolveManagedProject } from '@infra/project/resolve-project.js'

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
    '--external-id <external-task-id>',
    '--external-source beads',
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
 * 判断状态流转是否属于当前 CLI 允许的最小集合。
 *
 * 这一版不引入可配置状态机，而是把人工任务管理最常见的主链路固定在代码里。
 */
function isAllowedTaskStatusTransition(
  currentStatus: TaskRunRow['status'] | TaskUpdateStatusArgs['status'],
  nextStatus: TaskUpdateStatusArgs['status'],
): boolean {
  if (!nextStatus || currentStatus === nextStatus) {
    return true
  }

  const allowedTransitions: Record<
    Exclude<TaskUpdateStatusArgs['status'], undefined>,
    Array<Exclude<TaskUpdateStatusArgs['status'], undefined>>
  > = {
    todo: ['analyzing', 'blocked', 'cancelled'],
    analyzing: ['awaiting_plan_confirm', 'blocked', 'cancelled'],
    awaiting_plan_confirm: ['executing', 'cancelled'],
    executing: ['awaiting_result_confirm', 'blocked', 'cancelled'],
    awaiting_result_confirm: ['done', 'blocked', 'cancelled'],
    done: [],
    blocked: ['analyzing', 'cancelled'],
    cancelled: [],
  }

  return allowedTransitions[currentStatus as Exclude<TaskUpdateStatusArgs['status'], undefined>].includes(
    nextStatus,
  )
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
  const commandName = 'task update-status'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.status) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'STATUS_REQUIRED',
            message: messages.taskUpdateStatus.statusRequired,
          })
        : messages.taskUpdateStatus.statusRequired,
    }
  }

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
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskUpdateStatus.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : `${messages.taskUpdateStatus.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  let db
  try {
    db = await dependencies.bootstrapDatabase(resolveGlobalDatabasePath(context.homeDir))
  } catch {
    const dbPath = resolveGlobalDatabasePath(context.homeDir)
    return {
      exitCode: 4,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'DATABASE_BOOTSTRAP_FAILED',
            message: messages.taskUpdateStatus.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : `${messages.taskUpdateStatus.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }
  const taskStore = dependencies.createTaskStore(db)
  const projectId = `project:${managedProject.projectRoot}`
  const taskReference = resolveTaskReference({
    args,
    projectId,
    taskStore,
    messages: {
      idRequired: messages.taskUpdateStatus.idRequired,
      taskNotFound: messages.taskUpdateStatus.taskNotFound,
    },
  })

  if (!taskReference.ok) {
    db.close()
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: args.externalId ? 'TASK_NOT_FOUND' : 'TASK_REFERENCE_REQUIRED',
            message: args.externalId
              ? messages.taskUpdateStatus.taskNotFound
              : messages.taskUpdateStatus.idRequired,
            details: args.externalId
              ? {
                  externalSource: args.externalSource ?? 'beads',
                  externalId: args.externalId,
                }
              : undefined,
          })
        : taskReference.stdout,
    }
  }

  /**
   * 先查再写，而不是直接执行 update，有两个目的：
   * 1. 输出里要展示 from -> to，必须先拿到旧状态；
   * 2. 可以把“不存在”与“更新失败”区分开来，避免用户看到模糊错误。
   */
  const existingTask = taskStore.getTaskById({
    projectId,
    taskId: taskReference.value.taskId,
  })

  if (!existingTask) {
    db.close()
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'TASK_NOT_FOUND',
            message: messages.taskUpdateStatus.taskNotFound,
            details: {
              taskId: taskReference.value.taskId,
              externalSource: args.externalId ? (args.externalSource ?? 'beads') : null,
              externalId: args.externalId ?? null,
            },
          })
        : [
            messages.taskUpdateStatus.taskNotFound,
            `- taskId: ${taskReference.value.taskId}`,
            ...taskReference.value.referenceLines,
          ].join('\n'),
    }
  }

  if (!isAllowedTaskStatusTransition(existingTask.status, nextStatus)) {
    db.close()
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'INVALID_STATUS_TRANSITION',
            message: messages.taskUpdateStatus.invalidTransition,
            details: {
              taskId: taskReference.value.taskId,
              from: existingTask.status,
              to: nextStatus,
              externalSource: args.externalId ? (args.externalSource ?? 'beads') : null,
              externalId: args.externalId ?? null,
            },
          })
        : [
            messages.taskUpdateStatus.invalidTransition,
            `- taskId: ${taskReference.value.taskId}`,
            ...taskReference.value.referenceLines,
            `- from: ${existingTask.status}`,
            `- to: ${nextStatus}`,
          ].join('\n'),
    }
  }

  if (existingTask.status === nextStatus) {
    db.close()
    const data = {
      projectRoot: managedProject.projectRoot,
      taskId: taskReference.value.taskId,
      externalRef: args.externalId
        ? {
            externalSource: args.externalSource ?? 'beads',
            externalId: args.externalId,
          }
        : null,
      from: existingTask.status,
      to: nextStatus,
      changed: false,
    }

    return {
      exitCode: 0,
      stdout: args.json
        ? toJsonSuccessOutput(commandName, data)
        : [
            messages.taskUpdateStatus.unchanged,
            `- projectRoot: ${managedProject.projectRoot}`,
            `- taskId: ${taskReference.value.taskId}`,
            ...taskReference.value.referenceLines,
            `- status: ${nextStatus}`,
          ].join('\n'),
    }
  }

  const updatedAt = new Date().toISOString()
  /**
   * 当前态和历史态必须同事务更新，避免 `task` 与 `task_run` 数据脱节。
   */
  const updated = db.transaction(() => {
    const statusUpdated = taskStore.updateTaskStatus({
      projectId,
      taskId: taskReference.value.taskId,
      status: nextStatus,
      updatedAt,
    })

    if (!statusUpdated) {
      return false
    }

    syncTaskRunHistory(taskStore, taskReference.value.taskId, nextStatus, updatedAt)
    return true
  })()

  db.close()

  if (!updated) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'TASK_NOT_FOUND',
            message: messages.taskUpdateStatus.taskNotFound,
            details: {
              taskId: taskReference.value.taskId,
              externalSource: args.externalId ? (args.externalSource ?? 'beads') : null,
              externalId: args.externalId ?? null,
            },
          })
        : [
            messages.taskUpdateStatus.taskNotFound,
            `- taskId: ${taskReference.value.taskId}`,
            ...taskReference.value.referenceLines,
          ].join('\n'),
    }
  }

  const data = {
    projectRoot: managedProject.projectRoot,
    taskId: taskReference.value.taskId,
    externalRef: args.externalId
      ? {
          externalSource: args.externalSource ?? 'beads',
          externalId: args.externalId,
        }
      : null,
    from: existingTask.status,
    to: nextStatus,
    changed: true,
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
      messages.taskUpdateStatus.updated,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- taskId: ${taskReference.value.taskId}`,
      ...taskReference.value.referenceLines,
      `- from: ${existingTask.status}`,
      `- to: ${nextStatus}`,
    ].join('\n'),
  }
}
