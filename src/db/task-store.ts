/**
 * @file src/db/task-store.ts
 * @author michaeljou
 */

import type { SqliteDatabase } from '@/db/connect.js'

/**
 * `task` 表的行模型。
 *
 * 这张表保存任务的“当前态”，不保存完整运行历史。
 * 历史态后续会放在独立的 `task_run` 或类似表结构里。
 */
export type TaskRow = {
  /** 任务主键，当前采用 `task:<uuid>` 规则生成。 */
  id: string
  /** 所属项目主键，用于保证任务查询按项目隔离。 */
  project_id: string
  /** 面向用户展示的任务标题。 */
  title: string
  /** 可选的任务补充说明。 */
  description: string | null
  /** 任务来源，区分手工录入、外部同步或扫描建议。 */
  source_type: 'manual' | 'beads_sync' | 'scan_suggestion'
  /** 任务当前所处状态，是 CLI 读写最频繁的字段之一。 */
  status:
    | 'todo'
    | 'analyzing'
    | 'awaiting_plan_confirm'
    | 'executing'
    | 'awaiting_result_confirm'
    | 'done'
    | 'blocked'
    | 'cancelled'
  /** 任务优先级，供后续排序、筛选和提醒使用。 */
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  /** 任务类别，表达任务的大致工作形态。 */
  task_type: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init'
  /** 执行模式，预留给后续半自动和全自动编排。 */
  execution_mode: 'manual' | 'semi_auto' | 'auto'
  /** SQLite 兼容布尔位，表示是否需要人工确认计划。 */
  requires_plan_confirm: number
  /** 当前默认执行方。 */
  current_executor: 'codex' | 'beads' | 'none'
  /** 任务首次创建时间。 */
  created_at: string
  /** 任务最近一次状态或内容更新时间。 */
  updated_at: string
}

/**
 * `task_target` 表的行模型。
 *
 * 任务目标被单独拆表，是为了让一个任务能够绑定多个仓库或多个目标范围。
 */
export type TaskTargetRow = {
  /** 任务目标主键。 */
  id: string
  /** 所属任务主键。 */
  task_id: string
  /** 关联的仓库主键；如果目标不是仓库级，则允许为空。 */
  repository_id: string | null
  /** 目标类型，决定 `target_value` 的解释方式。 */
  target_type: 'repository' | 'module' | 'directory' | 'file_group'
  /** 目标值本身，例如模块名、目录路径或文件组描述。 */
  target_value: string | null
  /** 目标记录创建时间。 */
  created_at: string
}

/**
 * `task list` 使用的紧凑任务投影。
 *
 * 列表页只关心摘要信息，因此这里刻意不带 description 等大字段。
 */
export type TaskListRow = {
  id: string
  title: string
  status: TaskRow['status']
  priority: TaskRow['priority']
  task_type: TaskRow['task_type']
  updated_at: string
}

/**
 * 更新前用于存在性检查的最小任务投影。
 *
 * 这个结构只保留状态变更前真正需要读出的最小字段，避免多查无关信息。
 */
export type TaskSummaryRow = {
  id: string
  title: string
  status: TaskRow['status']
}

/**
 * `task show` 返回的扩展任务详情结构。
 *
 * 这里把任务主信息和目标列表聚合成一个返回值，减少命令层手工拼装的复杂度。
 */
export type TaskDetail = {
  task: {
    /** 任务主键。 */
    id: string
    /** 任务标题。 */
    title: string
    /** 任务说明。 */
    description: string | null
    /** 当前任务状态。 */
    status: TaskRow['status']
    /** 当前任务优先级。 */
    priority: TaskRow['priority']
    /** 当前任务类别。 */
    task_type: TaskRow['task_type']
    /** 当前默认执行方。 */
    current_executor: TaskRow['current_executor']
    /** 最近更新时间。 */
    updated_at: string
  }
  targets: Array<{
    /** 目标类型。 */
    target_type: TaskTargetRow['target_type']
    /** 目标值。 */
    target_value: string | null
    /** 关联仓库的相对路径，便于人类阅读。 */
    repository_path: string | null
  }>
}

function countRows(db: SqliteDatabase, tableName: 'task' | 'task_target'): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number }
  return row.count
}

export function createTaskStore(db: SqliteDatabase) {
  const insertTaskStmt = db.prepare(`
    INSERT INTO task (
      id, project_id, title, description, source_type, status, priority, task_type,
      execution_mode, requires_plan_confirm, current_executor, created_at, updated_at
    ) VALUES (
      @id, @project_id, @title, @description, @source_type, @status, @priority, @task_type,
      @execution_mode, @requires_plan_confirm, @current_executor, @created_at, @updated_at
    )
  `)

  const insertTaskTargetStmt = db.prepare(`
    INSERT INTO task_target (
      id, task_id, repository_id, target_type, target_value, created_at
    ) VALUES (
      @id, @task_id, @repository_id, @target_type, @target_value, @created_at
    )
  `)

  /**
   * 设计逻辑：
   * 1. 任务主记录和目标记录要么一起成功，要么一起失败。
   * 2. 否则会出现“有任务没目标”或“有目标没任务”的脏状态。
   */
  const createTaskTx = db.transaction((input: { task: TaskRow; targets: TaskTargetRow[] }) => {
    insertTaskStmt.run(input.task)

    for (const target of input.targets) {
      insertTaskTargetStmt.run(target)
    }
  })

  const listTasksStmt = db.prepare(`
    SELECT id, title, status, priority, task_type, updated_at
    FROM task
    WHERE project_id = @project_id
      AND (@status IS NULL OR status = @status)
    ORDER BY updated_at DESC, created_at DESC
  `)

  const getTaskByIdStmt = db.prepare(`
    SELECT id, title, status
    FROM task
    WHERE project_id = @project_id
      AND id = @id
    LIMIT 1
  `)

  const updateTaskStatusStmt = db.prepare(`
    UPDATE task
    SET status = @status,
        updated_at = @updated_at
    WHERE project_id = @project_id
      AND id = @id
  `)

  const getTaskDetailStmt = db.prepare(`
    SELECT id, title, description, status, priority, task_type, current_executor, updated_at
    FROM task
    WHERE project_id = @project_id
      AND id = @id
    LIMIT 1
  `)

  const listTaskTargetsStmt = db.prepare(`
    SELECT tt.target_type, tt.target_value, r.path AS repository_path
    FROM task_target tt
    LEFT JOIN repository r ON r.id = tt.repository_id
    WHERE tt.task_id = ?
    ORDER BY tt.created_at ASC
  `)

  return {
    /**
     * 在单个事务中插入任务及其全部目标。
     *
     * 这是任务登记的主入口。
     */
    createTask(input: { task: TaskRow; targets: TaskTargetRow[] }): void {
      createTaskTx(input)
    },
    /** 返回任务行数，主要供测试验证存储状态使用。 */
    countTasks(): number {
      return countRows(db, 'task')
    },
    /** 返回任务目标行数，主要供测试验证事务行为使用。 */
    countTaskTargets(): number {
      return countRows(db, 'task_target')
    },
    /**
     * 列出单个项目下的任务，并支持可选状态过滤。
     *
     * 查询始终按 `projectId` 限制，避免跨项目串数据。
     */
    listTasks(input: {
      projectId: string
      status?: TaskRow['status']
    }): TaskListRow[] {
      return listTasksStmt.all({
        project_id: input.projectId,
        status: input.status ?? null,
      }) as TaskListRow[]
    },
    /**
     * 返回状态变更前所需的最小任务摘要。
     *
     * 主要用于 `task update-status` 读取旧状态，再生成差异输出。
     */
    getTaskById(input: {
      projectId: string
      taskId: string
    }): TaskSummaryRow | null {
      return (
        (getTaskByIdStmt.get({
          project_id: input.projectId,
          id: input.taskId,
        }) as TaskSummaryRow | undefined) ?? null
      )
    },
    /**
     * 更新任务状态，并返回是否有记录被修改。
     *
     * 这里不直接抛“不存在”错误，而是把判断留给命令层做更友好的输出。
     */
    updateTaskStatus(input: {
      projectId: string
      taskId: string
      status: TaskRow['status']
      updatedAt: string
    }): boolean {
      const result = updateTaskStatusStmt.run({
        project_id: input.projectId,
        id: input.taskId,
        status: input.status,
        updated_at: input.updatedAt,
      })

      return result.changes > 0
    },
    /**
     * 加载任务详情以及与仓库关联的目标信息。
     *
     * 详情查询会把仓库路径一并查出，避免命令层再做额外 join。
     */
    getTaskDetail(input: {
      projectId: string
      taskId: string
    }): TaskDetail | null {
      const task = getTaskDetailStmt.get({
        project_id: input.projectId,
        id: input.taskId,
      }) as TaskDetail['task'] | undefined

      if (!task) {
        return null
      }

      return {
        task,
        targets: listTaskTargetsStmt.all(input.taskId) as TaskDetail['targets'],
      }
    },
  }
}
