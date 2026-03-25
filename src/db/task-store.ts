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
 * `task_run` 表的行模型。
 *
 * 这张表承载任务运行历史，和 `task` 的当前态分离保存。
 * 一个任务可以拥有多条运行记录，用于表达分析、执行、验证等阶段性过程。
 */
export type TaskRunRow = {
  /** 运行记录主键。 */
  id: string
  /** 所属任务主键。 */
  task_id: string
  /** 运行类型，说明这条历史对应哪个阶段。 */
  run_type: 'analysis' | 'execution' | 'verification'
  /** 实际执行方，和任务默认执行方不是一个概念。 */
  executor: 'codex' | 'manual' | 'future_reserved'
  /** 运行记录当前状态。 */
  status: 'running' | 'success' | 'failed' | 'cancelled'
  /** 面向人的摘要说明，可记录本轮简要结论。 */
  summary: string | null
  /** 本轮运行开始时间。 */
  started_at: string
  /** 本轮运行结束时间；未结束时为空。 */
  ended_at: string | null
  /** 记录创建时间。 */
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
  source_type: TaskRow['source_type']
  status: TaskRow['status']
  priority: TaskRow['priority']
  task_type: TaskRow['task_type']
  current_executor: TaskRow['current_executor']
  updated_at: string
}

/**
 * `task next` 使用的候选任务投影。
 *
 * 这份结构比 `task list` 多保留一个 `description`，因为“下一条任务”
 * 是一个聚焦视图，允许在不切到详情页的情况下多看一层上下文。
 */
export type TaskNextRow = {
  id: string
  title: string
  description: string | null
  source_type: TaskRow['source_type']
  status: TaskRow['status']
  priority: TaskRow['priority']
  task_type: TaskRow['task_type']
  current_executor: TaskRow['current_executor']
  updated_at: string
}

/**
 * 未完成扫描建议与仓库之间的最小映射结构。
 *
 * 这个投影只在去重场景使用，因此只保留仓库主键，不回传多余任务字段。
 */
export type OpenScanSuggestionRepositoryRow = {
  /** 已有未完成扫描建议任务绑定的仓库主键。 */
  repository_id: string
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
  priority: TaskRow['priority']
  current_executor: TaskRow['current_executor']
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

function countRows(db: SqliteDatabase, tableName: 'task' | 'task_target' | 'task_run'): number {
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

  const insertTaskRunStmt = db.prepare(`
    INSERT INTO task_run (
      id, task_id, run_type, executor, status, summary, started_at, ended_at, created_at
    ) VALUES (
      @id, @task_id, @run_type, @executor, @status, @summary, @started_at, @ended_at, @created_at
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
    SELECT id, title, source_type, status, priority, task_type, current_executor, updated_at
    FROM task
    WHERE project_id = @project_id
      AND (@status IS NULL OR status = @status)
      AND (@source_type IS NULL OR source_type = @source_type)
      AND (@current_executor IS NULL OR current_executor = @current_executor)
    ORDER BY updated_at DESC, created_at DESC
  `)

  const getTaskByIdStmt = db.prepare(`
    SELECT id, title, status, priority, current_executor
    FROM task
    WHERE project_id = @project_id
      AND id = @id
    LIMIT 1
  `)

  const getNextTaskStmt = db.prepare(`
    SELECT id, title, description, source_type, status, priority, task_type, current_executor, updated_at
    FROM task
    WHERE project_id = @project_id
      AND status IN ('todo', 'analyzing', 'awaiting_plan_confirm', 'executing', 'awaiting_result_confirm')
      AND (@source_type IS NULL OR source_type = @source_type)
      AND (@current_executor IS NULL OR current_executor = @current_executor)
    ORDER BY
      CASE status
        WHEN 'executing' THEN 0
        WHEN 'awaiting_result_confirm' THEN 1
        WHEN 'awaiting_plan_confirm' THEN 2
        WHEN 'analyzing' THEN 3
        WHEN 'todo' THEN 4
        ELSE 9
      END ASC,
      CASE priority
        WHEN 'P0' THEN 0
        WHEN 'P1' THEN 1
        WHEN 'P2' THEN 2
        WHEN 'P3' THEN 3
        ELSE 9
      END ASC,
      updated_at DESC,
      created_at DESC
    LIMIT 1
  `)

  const updateTaskStatusStmt = db.prepare(`
    UPDATE task
    SET status = @status,
        updated_at = @updated_at
    WHERE project_id = @project_id
      AND id = @id
  `)

  const updateTaskExecutorStmt = db.prepare(`
    UPDATE task
    SET current_executor = @current_executor,
        updated_at = @updated_at
    WHERE project_id = @project_id
      AND id = @id
  `)

  const updateTaskPriorityStmt = db.prepare(`
    UPDATE task
    SET priority = @priority,
        updated_at = @updated_at
    WHERE project_id = @project_id
      AND id = @id
  `)

  const updateTaskMetadataStmt = db.prepare(`
    UPDATE task
    SET title = @title,
        description = @description,
        task_type = @task_type,
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

  const listTaskRunsStmt = db.prepare(`
    SELECT id, task_id, run_type, executor, status, summary, started_at, ended_at, created_at
    FROM task_run
    WHERE task_id = @task_id
    ORDER BY started_at DESC, created_at DESC
  `)

  const listOpenScanSuggestionRepositoryIdsStmt = db.prepare(`
    SELECT DISTINCT tt.repository_id
    FROM task t
    JOIN task_target tt ON tt.task_id = t.id
    WHERE t.project_id = @project_id
      AND t.source_type = 'scan_suggestion'
      AND t.status NOT IN ('done', 'cancelled')
      AND tt.target_type = 'repository'
      AND tt.repository_id IS NOT NULL
    ORDER BY tt.repository_id ASC
  `)

  const getLatestOpenTaskRunStmt = db.prepare(`
    SELECT id
    FROM task_run
    WHERE task_id = @task_id
      AND ended_at IS NULL
    ORDER BY started_at DESC, created_at DESC
    LIMIT 1
  `)

  const getLatestOpenTaskRunByTypeStmt = db.prepare(`
    SELECT id
    FROM task_run
    WHERE task_id = @task_id
      AND run_type = @run_type
      AND ended_at IS NULL
    ORDER BY started_at DESC, created_at DESC
    LIMIT 1
  `)

  const finishTaskRunStmt = db.prepare(`
    UPDATE task_run
    SET status = @status,
        summary = @summary,
        ended_at = @ended_at
    WHERE id = @id
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
    /** 返回运行历史行数，主要供测试验证 `task_run` 写入行为。 */
    countTaskRuns(): number {
      return countRows(db, 'task_run')
    },
    /**
     * 列出单个项目下的任务，并支持可选状态过滤。
     *
     * 查询始终按 `projectId` 限制，避免跨项目串数据。
     */
    listTasks(input: {
      projectId: string
      status?: TaskRow['status']
      sourceType?: TaskRow['source_type']
      executor?: TaskRow['current_executor']
    }): TaskListRow[] {
      return listTasksStmt.all({
        project_id: input.projectId,
        status: input.status ?? null,
        source_type: input.sourceType ?? null,
        current_executor: input.executor ?? null,
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
     * 选择当前项目里最值得优先推进的一条任务。
     *
     * 排序逻辑分三层：
     * 1. 先看任务是否已经进入活跃阶段，避免“正在做的事”被普通待办淹没；
     * 2. 再按优先级排序，保证高优先级任务优先；
     * 3. 最后用更新时间打破并列，优先返回最近仍在被关注的任务。
     *
     * `blocked` / `done` / `cancelled` 明确不参与候选，
     * 因为这些状态都不属于“现在就该继续推进”的集合。
     */
    getNextTask(input: {
      projectId: string
      sourceType?: TaskRow['source_type']
      executor?: TaskRow['current_executor']
    }): TaskNextRow | null {
      return (
        (getNextTaskStmt.get({
          project_id: input.projectId,
          source_type: input.sourceType ?? null,
          current_executor: input.executor ?? null,
        }) as TaskNextRow | undefined) ?? null
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
     * 更新任务当前责任执行器，并返回是否有记录被修改。
     *
     * 这一层只处理当前态字段，不负责推导运行历史或状态流转。
     */
    updateTaskExecutor(input: {
      projectId: string
      taskId: string
      executor: TaskRow['current_executor']
      updatedAt: string
    }): boolean {
      const result = updateTaskExecutorStmt.run({
        project_id: input.projectId,
        id: input.taskId,
        current_executor: input.executor,
        updated_at: input.updatedAt,
      })

      return result.changes > 0
    },
    /**
     * 更新任务优先级，并返回是否有记录被修改。
     *
     * 这一层同样只关心当前态字段，不承担任何“重新排程”副作用。
     * 是否需要重新挑选下一条任务，由上层命令在下一次查询时自然体现。
     */
    updateTaskPriority(input: {
      projectId: string
      taskId: string
      priority: TaskRow['priority']
      updatedAt: string
    }): boolean {
      const result = updateTaskPriorityStmt.run({
        project_id: input.projectId,
        id: input.taskId,
        priority: input.priority,
        updated_at: input.updatedAt,
      })

      return result.changes > 0
    },
    /**
     * 更新任务的可编辑元数据字段。
     *
     * 当前只开放三类人工最常改动的信息：
     * - `title`
     * - `description`
     * - `task_type`
     *
     * 这三个字段都属于“当前态描述信息”，不会影响运行历史表，
     * 也不会在这里触发额外的调度、副作用或状态流转。
     */
    updateTaskMetadata(input: {
      projectId: string
      taskId: string
      title: string
      description: string | null
      taskType: TaskRow['task_type']
      updatedAt: string
    }): boolean {
      const result = updateTaskMetadataStmt.run({
        project_id: input.projectId,
        id: input.taskId,
        title: input.title,
        description: input.description,
        task_type: input.taskType,
        updated_at: input.updatedAt,
      })

      return result.changes > 0
    },
    /**
     * 新建一条运行历史。
     *
     * 这一层只负责持久化，不主动推断状态映射；
     * 映射策略由上层命令或编排逻辑决定后，再把明确的行模型传进来。
     */
    startTaskRun(input: {
      run: TaskRunRow
    }): void {
      insertTaskRunStmt.run(input.run)
    },
    /**
     * 结束最近一条尚未结束的运行历史。
     *
     * 当传入 `runType` 时，会把搜索范围收窄到同类型运行；
     * 否则默认关闭“最近开始且尚未结束”的那一条记录。
     */
    finishLatestTaskRun(input: {
      taskId: string
      runType?: TaskRunRow['run_type']
      status: 'success' | 'failed' | 'cancelled'
      summary?: string | null
      endedAt: string
    }): boolean {
      const row = input.runType
        ? (getLatestOpenTaskRunByTypeStmt.get({
            task_id: input.taskId,
            run_type: input.runType,
          }) as { id: string } | undefined)
        : (getLatestOpenTaskRunStmt.get({
            task_id: input.taskId,
          }) as { id: string } | undefined)

      if (!row) {
        return false
      }

      const result = finishTaskRunStmt.run({
        id: row.id,
        status: input.status,
        summary: input.summary ?? null,
        ended_at: input.endedAt,
      })

      return result.changes > 0
    },
    /**
     * 按开始时间倒序读取任务的全部运行历史。
     *
     * 详情页和后续历史页都应直接复用这里的排序，避免不同命令各自定义展示顺序。
     */
    listTaskRuns(input: {
      taskId: string
    }): TaskRunRow[] {
      return listTaskRunsStmt.all({
        task_id: input.taskId,
      }) as TaskRunRow[]
    },
    /**
     * 列出当前项目里已经存在“未完成扫描建议任务”的仓库主键。
     *
     * 这个查询专门服务于 `task suggest-scan` 的去重逻辑：
     * - 只关注 `scan_suggestion` 来源；
     * - 只关注仓库级目标；
     * - 已完成或已取消的建议不会阻止重新生成。
     */
    listOpenScanSuggestionRepositoryIds(input: {
      projectId: string
    }): string[] {
      return (listOpenScanSuggestionRepositoryIdsStmt.all({
        project_id: input.projectId,
      }) as OpenScanSuggestionRepositoryRow[]).map((row) => row.repository_id)
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
