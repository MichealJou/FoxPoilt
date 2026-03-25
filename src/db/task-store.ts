import type { SqliteDatabase } from './connect.js'

export type TaskRow = {
  id: string
  project_id: string
  title: string
  description: string | null
  source_type: 'manual' | 'beads_sync' | 'scan_suggestion'
  status:
    | 'todo'
    | 'analyzing'
    | 'awaiting_plan_confirm'
    | 'executing'
    | 'awaiting_result_confirm'
    | 'done'
    | 'blocked'
    | 'cancelled'
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  task_type: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init'
  execution_mode: 'manual' | 'semi_auto' | 'auto'
  requires_plan_confirm: number
  current_executor: 'codex' | 'beads' | 'none'
  created_at: string
  updated_at: string
}

export type TaskTargetRow = {
  id: string
  task_id: string
  repository_id: string | null
  target_type: 'repository' | 'module' | 'directory' | 'file_group'
  target_value: string | null
  created_at: string
}

export type TaskListRow = {
  id: string
  title: string
  status: TaskRow['status']
  priority: TaskRow['priority']
  task_type: TaskRow['task_type']
  updated_at: string
}

export type TaskSummaryRow = {
  id: string
  title: string
  status: TaskRow['status']
}

export type TaskDetail = {
  task: {
    id: string
    title: string
    description: string | null
    status: TaskRow['status']
    priority: TaskRow['priority']
    task_type: TaskRow['task_type']
    current_executor: TaskRow['current_executor']
    updated_at: string
  }
  targets: Array<{
    target_type: TaskTargetRow['target_type']
    target_value: string | null
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
    createTask(input: { task: TaskRow; targets: TaskTargetRow[] }): void {
      createTaskTx(input)
    },
    countTasks(): number {
      return countRows(db, 'task')
    },
    countTaskTargets(): number {
      return countRows(db, 'task_target')
    },
    listTasks(input: {
      projectId: string
      status?: TaskRow['status']
    }): TaskListRow[] {
      return listTasksStmt.all({
        project_id: input.projectId,
        status: input.status ?? null,
      }) as TaskListRow[]
    },
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
