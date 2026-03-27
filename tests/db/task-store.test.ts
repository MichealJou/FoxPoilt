import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

type DatabaseLike = {
  close?: () => void
}

type BootstrapDatabase = (dbPath: string) => Promise<DatabaseLike> | DatabaseLike

type TaskStore = {
  createTask: (input: {
    task: {
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
    targets: Array<{
      id: string
      task_id: string
      repository_id: string | null
      target_type: 'repository' | 'module' | 'directory' | 'file_group'
      target_value: string | null
      created_at: string
    }>
  }) => void
  countTasks: () => number
  countTaskTargets: () => number
  countTaskRuns: () => number
  listTasks: (input: {
    projectId: string
    status?: 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'
    sourceType?: 'manual' | 'beads_sync' | 'scan_suggestion'
    executor?: 'codex' | 'beads' | 'none'
  }) => Array<{
    id: string
    title: string
    source_type: string
    status: string
    priority: string
    task_type: string
    current_executor: string
  }>
  getNextTask: (input: {
    projectId: string
    sourceType?: 'manual' | 'beads_sync' | 'scan_suggestion'
    executor?: 'codex' | 'beads' | 'none'
  }) => {
    id: string
    title: string
    description: string | null
    source_type: string
    status: string
    priority: string
    task_type: string
    current_executor: string
    updated_at: string
  } | null
  getTaskById: (input: {
    projectId: string
    taskId: string
  }) => {
    id: string
    title: string
    status: string
    priority: string
    current_executor: string
  } | null
  updateTaskStatus: (input: {
    projectId: string
    taskId: string
    status: 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'
    updatedAt: string
  }) => boolean
  updateTaskExecutor: (input: {
    projectId: string
    taskId: string
    executor: 'codex' | 'beads' | 'none'
    updatedAt: string
  }) => boolean
  updateTaskPriority: (input: {
    projectId: string
    taskId: string
    priority: 'P0' | 'P1' | 'P2' | 'P3'
    updatedAt: string
  }) => boolean
  updateTaskMetadata: (input: {
    projectId: string
    taskId: string
    title: string
    description: string | null
    taskType: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init'
    updatedAt: string
  }) => boolean
  startTaskRun: (input: {
    run: {
      id: string
      task_id: string
      run_type: 'analysis' | 'execution' | 'verification'
      executor: 'codex' | 'manual' | 'future_reserved'
      status: 'running' | 'success' | 'failed' | 'cancelled'
      summary: string | null
      started_at: string
      ended_at: string | null
      created_at: string
    }
  }) => void
  finishLatestTaskRun: (input: {
    taskId: string
    runType?: 'analysis' | 'execution' | 'verification'
    status: 'success' | 'failed' | 'cancelled'
    summary?: string | null
    endedAt: string
  }) => boolean
  listTaskRuns: (input: {
    taskId: string
  }) => Array<{
    id: string
    task_id: string
    run_type: 'analysis' | 'execution' | 'verification'
    executor: 'codex' | 'manual' | 'future_reserved'
    status: 'running' | 'success' | 'failed' | 'cancelled'
    summary: string | null
    started_at: string
    ended_at: string | null
    created_at: string
  }>
  getTaskDetail: (input: {
    projectId: string
    taskId: string
  }) => {
    task: {
      id: string
      title: string
      description: string | null
      status: string
      priority: string
      task_type: string
      current_executor: string
    }
    targets: Array<{
      target_type: string
      target_value: string | null
      repository_path: string | null
    }>
  } | null
  listOpenScanSuggestionRepositoryIds: (input: {
    projectId: string
  }) => string[]
}

async function loadModules(): Promise<{
  bootstrapDatabase: BootstrapDatabase
  createCatalogStore: (db: unknown) => {
    upsertProjectCatalog: (input: {
      workspaceRoot: {
        id: string
        name: string
        path: string
        enabled: number
        description: string | null
        created_at: string
        updated_at: string
      }
      project: {
        id: string
        workspace_root_id: string
        name: string
        display_name: string | null
        root_path: string
        source_type: 'manual' | 'auto_discovered'
        status: 'pending' | 'managed' | 'disabled' | 'archived'
        description: string | null
        created_at: string
        updated_at: string
      }
      repositories: Array<{
        id: string
        project_id: string
        name: string
        display_name: string | null
        path: string
        repo_type: 'git' | 'directory' | 'subrepo'
        language_stack: string | null
        enabled: number
        created_at: string
        updated_at: string
      }>
    }) => void
  }
  createTaskStore: (db: unknown) => TaskStore
}> {
  const bootstrap = await import('@foxpilot/infra/db/bootstrap.js')
  const catalogStore = await import('@foxpilot/infra/db/catalog-store.js')
  const taskStore = await import('@foxpilot/infra/db/task-store.js')

  return {
    bootstrapDatabase: bootstrap.bootstrapDatabase,
    createCatalogStore: catalogStore.createCatalogStore as unknown as (db: unknown) => {
      upsertProjectCatalog: (input: {
        workspaceRoot: {
          id: string
          name: string
          path: string
          enabled: number
          description: string | null
          created_at: string
          updated_at: string
        }
        project: {
          id: string
          workspace_root_id: string
          name: string
          display_name: string | null
          root_path: string
          source_type: 'manual' | 'auto_discovered'
          status: 'pending' | 'managed' | 'disabled' | 'archived'
          description: string | null
          created_at: string
          updated_at: string
        }
        repositories: Array<{
          id: string
          project_id: string
          name: string
          display_name: string | null
          path: string
          repo_type: 'git' | 'directory' | 'subrepo'
          language_stack: string | null
          enabled: number
          created_at: string
          updated_at: string
        }>
      }) => void
    },
    createTaskStore: taskStore.createTaskStore as unknown as (db: unknown) => TaskStore,
  }
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

describe('task store', () => {
  it('creates a manual task without targets', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:1',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '整理 init 后续任务',
        description: '先把手动任务登记做出来',
        source_type: 'manual',
        status: 'todo',
        priority: 'P2',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [],
    })

    expect(taskStore.countTasks()).toBe(1)
    expect(taskStore.countTaskTargets()).toBe(0)

    db.close?.()
  })

  it('creates repository targets together with the task', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [
        {
          id: 'repository:/Users/program/code/foxpilot-workspace:frontend',
          project_id: 'project:/Users/program/code/foxpilot-workspace',
          name: 'frontend',
          display_name: 'Frontend',
          path: 'frontend',
          repo_type: 'git',
          language_stack: '',
          enabled: 1,
          created_at: now,
          updated_at: now,
        },
      ],
    })

    taskStore.createTask({
      task: {
        id: 'task:2',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '补 frontend 样式',
        description: null,
        source_type: 'manual',
        status: 'todo',
        priority: 'P1',
        task_type: 'frontend',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [
        {
          id: 'task_target:2:1',
          task_id: 'task:2',
          repository_id: 'repository:/Users/program/code/foxpilot-workspace:frontend',
          target_type: 'repository',
          target_value: null,
          created_at: now,
        },
      ],
    })

    expect(taskStore.countTasks()).toBe(1)
    expect(taskStore.countTaskTargets()).toBe(1)

    db.close?.()
  })

  it('lists tasks for a project and supports status filtering', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:todo',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '先做任务列表',
        description: null,
        source_type: 'manual',
        status: 'todo',
        priority: 'P2',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:done',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '完成 init',
        description: null,
        source_type: 'manual',
        status: 'done',
        priority: 'P1',
        task_type: 'init',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: '2026-03-25T00:01:00Z',
        updated_at: '2026-03-25T00:01:00Z',
      },
      targets: [],
    })

    expect(
      taskStore.listTasks({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
      }).map((item) => item.id),
    ).toEqual(['task:done', 'task:todo'])

    expect(
      taskStore.listTasks({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        status: 'todo',
      }).map((item) => item.id),
    ).toEqual(['task:todo'])

    db.close?.()
  })

  it('selects the next actionable task by status rank, priority, source, and executor', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:todo-high',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '高优先级待办',
        description: null,
        source_type: 'manual',
        status: 'todo',
        priority: 'P0',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:analysis-beads',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '需要 beads 继续分析',
        description: '保留给 beads 的分析任务',
        source_type: 'scan_suggestion',
        status: 'analyzing',
        priority: 'P2',
        task_type: 'init',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'beads',
        created_at: '2026-03-25T00:01:00Z',
        updated_at: '2026-03-25T00:01:00Z',
      },
      targets: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:executing-low',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '低优先级但已执行中',
        description: null,
        source_type: 'manual',
        status: 'executing',
        priority: 'P3',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: '2026-03-25T00:02:00Z',
        updated_at: '2026-03-25T00:02:00Z',
      },
      targets: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:blocked-top',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '已阻塞任务',
        description: null,
        source_type: 'manual',
        status: 'blocked',
        priority: 'P0',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: '2026-03-25T00:03:00Z',
        updated_at: '2026-03-25T00:03:00Z',
      },
      targets: [],
    })

    expect(
      taskStore.getNextTask({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
      }),
    ).toMatchObject({
      id: 'task:executing-low',
      status: 'executing',
    })

    expect(
      taskStore.getNextTask({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        executor: 'beads',
      }),
    ).toMatchObject({
      id: 'task:analysis-beads',
      current_executor: 'beads',
    })

    expect(
      taskStore.getNextTask({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        sourceType: 'scan_suggestion',
      }),
    ).toMatchObject({
      id: 'task:analysis-beads',
      source_type: 'scan_suggestion',
    })

    db.close?.()
  })

  it('rolls back the whole createTask transaction when target insert fails', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    expect(() =>
      taskStore.createTask({
        task: {
          id: 'task:rollback',
          project_id: 'project:/Users/program/code/foxpilot-workspace',
          title: '应该回滚',
          description: null,
          source_type: 'manual',
          status: 'todo',
          priority: 'P2',
          task_type: 'generic',
          execution_mode: 'manual',
          requires_plan_confirm: 1,
          current_executor: 'codex',
          created_at: now,
          updated_at: now,
        },
        targets: [
          {
            id: 'task_target:rollback',
            task_id: 'task:rollback',
            repository_id: null,
            target_type: 'repository',
            target_value: null,
            created_at: now,
          },
        ],
      }),
    ).toThrow()

    expect(taskStore.countTasks()).toBe(0)
    expect(taskStore.countTaskTargets()).toBe(0)

    db.close?.()
  })

  it('updates task status only within the target project', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/other',
        name: 'other',
        path: '/Users/program/other',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/other/demo',
        workspace_root_id: 'workspace_root:/Users/program/other',
        name: 'demo',
        display_name: 'Demo',
        root_path: '/Users/program/other/demo',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:update-me',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '推进状态',
        description: null,
        source_type: 'manual',
        status: 'todo',
        priority: 'P2',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [],
    })

    expect(
      taskStore.updateTaskStatus({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:update-me',
        status: 'analyzing',
        updatedAt: '2026-03-25T00:01:00Z',
      }),
    ).toBe(true)

    expect(
      taskStore.getTaskById({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:update-me',
      }),
    ).toMatchObject({
      id: 'task:update-me',
      status: 'analyzing',
    })

    expect(
      taskStore.updateTaskStatus({
        projectId: 'project:/Users/program/other/demo',
        taskId: 'task:update-me',
        status: 'done',
        updatedAt: '2026-03-25T00:02:00Z',
      }),
    ).toBe(false)

    db.close?.()
  })

  it('updates task executor only within the target project', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/other',
        name: 'other',
        path: '/Users/program/other',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/other/demo',
        workspace_root_id: 'workspace_root:/Users/program/other',
        name: 'demo',
        display_name: 'Demo',
        root_path: '/Users/program/other/demo',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:update-executor',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '切换执行器',
        description: null,
        source_type: 'manual',
        status: 'todo',
        priority: 'P2',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [],
    })

    expect(
      taskStore.updateTaskExecutor({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:update-executor',
        executor: 'beads',
        updatedAt: '2026-03-25T00:01:00Z',
      }),
    ).toBe(true)

    expect(
      taskStore.getTaskDetail({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:update-executor',
      }),
    ).toMatchObject({
      task: {
        id: 'task:update-executor',
        current_executor: 'beads',
      },
    })

    expect(
      taskStore.updateTaskExecutor({
        projectId: 'project:/Users/program/other/demo',
        taskId: 'task:update-executor',
        executor: 'none',
        updatedAt: '2026-03-25T00:02:00Z',
      }),
    ).toBe(false)

    db.close?.()
  })

  it('updates task priority only within the target project', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/other',
        name: 'other',
        path: '/Users/program/other',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/other/demo',
        workspace_root_id: 'workspace_root:/Users/program/other',
        name: 'demo',
        display_name: 'Demo',
        root_path: '/Users/program/other/demo',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:update-priority',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '提升优先级',
        description: null,
        source_type: 'manual',
        status: 'todo',
        priority: 'P2',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [],
    })

    expect(
      taskStore.updateTaskPriority({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:update-priority',
        priority: 'P0',
        updatedAt: '2026-03-25T00:01:00Z',
      }),
    ).toBe(true)

    expect(
      taskStore.getTaskById({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:update-priority',
      }),
    ).toMatchObject({
      id: 'task:update-priority',
      priority: 'P0',
    })

    expect(
      taskStore.updateTaskPriority({
        projectId: 'project:/Users/program/other/demo',
        taskId: 'task:update-priority',
        priority: 'P3',
        updatedAt: '2026-03-25T00:02:00Z',
      }),
    ).toBe(false)

    db.close?.()
  })

  it('updates task metadata only within the target project', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/other',
        name: 'other',
        path: '/Users/program/other',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/other/demo',
        workspace_root_id: 'workspace_root:/Users/program/other',
        name: 'demo',
        display_name: 'Demo',
        root_path: '/Users/program/other/demo',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:update-metadata',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '原始标题',
        description: '原始描述',
        source_type: 'manual',
        status: 'todo',
        priority: 'P2',
        task_type: 'docs',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [],
    })

    expect(
      taskStore.updateTaskMetadata({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:update-metadata',
        title: '更新标题',
        description: null,
        taskType: 'backend',
        updatedAt: '2026-03-25T00:01:00Z',
      }),
    ).toBe(true)

    expect(
      taskStore.getTaskDetail({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:update-metadata',
      }),
    ).toMatchObject({
      task: {
        id: 'task:update-metadata',
        title: '更新标题',
        description: null,
        task_type: 'backend',
      },
    })

    expect(
      taskStore.updateTaskMetadata({
        projectId: 'project:/Users/program/other/demo',
        taskId: 'task:update-metadata',
        title: '串项目标题',
        description: '串项目描述',
        taskType: 'frontend',
        updatedAt: '2026-03-25T00:02:00Z',
      }),
    ).toBe(false)

    db.close?.()
  })

  it('returns task detail with linked targets only for the current project', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [
        {
          id: 'repository:/Users/program/code/foxpilot-workspace:frontend',
          project_id: 'project:/Users/program/code/foxpilot-workspace',
          name: 'frontend',
          display_name: 'Frontend',
          path: 'frontend',
          repo_type: 'git',
          language_stack: '',
          enabled: 1,
          created_at: now,
          updated_at: now,
        },
      ],
    })

    taskStore.createTask({
      task: {
        id: 'task:detail',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '查看详情',
        description: '需要把目标展示出来',
        source_type: 'manual',
        status: 'todo',
        priority: 'P1',
        task_type: 'frontend',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [
        {
          id: 'task_target:detail',
          task_id: 'task:detail',
          repository_id: 'repository:/Users/program/code/foxpilot-workspace:frontend',
          target_type: 'repository',
          target_value: null,
          created_at: now,
        },
      ],
    })

    expect(
      taskStore.getTaskDetail({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
        taskId: 'task:detail',
      }),
    ).toMatchObject({
      task: {
        id: 'task:detail',
        title: '查看详情',
        status: 'todo',
        priority: 'P1',
        task_type: 'frontend',
        updated_at: now,
      },
      targets: [
        {
          target_type: 'repository',
          repository_path: 'frontend',
        },
      ],
    })

    expect(
      taskStore.getTaskDetail({
        projectId: 'project:/Users/program/other/demo',
        taskId: 'task:detail',
      }),
    ).toBeNull()

    db.close?.()
  })

  it('stores task runs and finishes the latest open run in reverse time order', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [],
    })

    taskStore.createTask({
      task: {
        id: 'task:history',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '记录运行历史',
        description: null,
        source_type: 'manual',
        status: 'todo',
        priority: 'P2',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'codex',
        created_at: now,
        updated_at: now,
      },
      targets: [],
    })

    taskStore.startTaskRun({
      run: {
        id: 'task_run:analysis',
        task_id: 'task:history',
        run_type: 'analysis',
        executor: 'manual',
        status: 'running',
        summary: '开始分析任务',
        started_at: '2026-03-25T00:01:00Z',
        ended_at: null,
        created_at: '2026-03-25T00:01:00Z',
      },
    })

    taskStore.startTaskRun({
      run: {
        id: 'task_run:execution',
        task_id: 'task:history',
        run_type: 'execution',
        executor: 'codex',
        status: 'running',
        summary: '开始执行任务',
        started_at: '2026-03-25T00:02:00Z',
        ended_at: null,
        created_at: '2026-03-25T00:02:00Z',
      },
    })

    expect(taskStore.finishLatestTaskRun({
      taskId: 'task:history',
      status: 'failed',
      summary: '执行被阻塞',
      endedAt: '2026-03-25T00:03:00Z',
    })).toBe(true)

    expect(taskStore.finishLatestTaskRun({
      taskId: 'task:history',
      runType: 'analysis',
      status: 'success',
      summary: '分析完成',
      endedAt: '2026-03-25T00:04:00Z',
    })).toBe(true)

    expect(taskStore.countTaskRuns()).toBe(2)
    expect(taskStore.listTaskRuns({
      taskId: 'task:history',
    })).toEqual([
      {
        id: 'task_run:execution',
        task_id: 'task:history',
        run_type: 'execution',
        executor: 'codex',
        status: 'failed',
        summary: '执行被阻塞',
        started_at: '2026-03-25T00:02:00Z',
        ended_at: '2026-03-25T00:03:00Z',
        created_at: '2026-03-25T00:02:00Z',
      },
      {
        id: 'task_run:analysis',
        task_id: 'task:history',
        run_type: 'analysis',
        executor: 'manual',
        status: 'success',
        summary: '分析完成',
        started_at: '2026-03-25T00:01:00Z',
        ended_at: '2026-03-25T00:04:00Z',
        created_at: '2026-03-25T00:01:00Z',
      },
    ])

    db.close?.()
  })

  it('lists repository ids that already have unfinished scan suggestion tasks', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const now = '2026-03-25T00:00:00Z'
    const { bootstrapDatabase, createCatalogStore, createTaskStore } = await loadModules()

    const db = await bootstrapDatabase(dbPath)
    const catalogStore = createCatalogStore(db)
    const taskStore = createTaskStore(db)

    catalogStore.upsertProjectCatalog({
      workspaceRoot: {
        id: 'workspace_root:/Users/program/code',
        name: 'code',
        path: '/Users/program/code',
        enabled: 1,
        description: null,
        created_at: now,
        updated_at: now,
      },
      project: {
        id: 'project:/Users/program/code/foxpilot-workspace',
        workspace_root_id: 'workspace_root:/Users/program/code',
        name: 'foxpilot',
        display_name: 'Foxpilot',
        root_path: '/Users/program/code/foxpilot-workspace',
        source_type: 'manual',
        status: 'managed',
        description: null,
        created_at: now,
        updated_at: now,
      },
      repositories: [
        {
          id: 'repository:/Users/program/code/foxpilot-workspace:.',
          project_id: 'project:/Users/program/code/foxpilot-workspace',
          name: 'foxpilot-workspace',
          display_name: 'Foxpilot Workspace',
          path: '.',
          repo_type: 'git',
          language_stack: '',
          enabled: 1,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'repository:/Users/program/code/foxpilot-workspace:frontend',
          project_id: 'project:/Users/program/code/foxpilot-workspace',
          name: 'frontend',
          display_name: 'Frontend',
          path: 'frontend',
          repo_type: 'git',
          language_stack: '',
          enabled: 1,
          created_at: now,
          updated_at: now,
        },
      ],
    })

    taskStore.createTask({
      task: {
        id: 'task:scan-open',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '扫描建议: 根仓库',
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
          id: 'task_target:scan-open',
          task_id: 'task:scan-open',
          repository_id: 'repository:/Users/program/code/foxpilot-workspace:.',
          target_type: 'repository',
          target_value: null,
          created_at: now,
        },
      ],
    })

    taskStore.createTask({
      task: {
        id: 'task:scan-done',
        project_id: 'project:/Users/program/code/foxpilot-workspace',
        title: '扫描建议: frontend',
        description: null,
        source_type: 'scan_suggestion',
        status: 'done',
        priority: 'P2',
        task_type: 'init',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'none',
        created_at: '2026-03-25T00:01:00Z',
        updated_at: '2026-03-25T00:01:00Z',
      },
      targets: [
        {
          id: 'task_target:scan-done',
          task_id: 'task:scan-done',
          repository_id: 'repository:/Users/program/code/foxpilot-workspace:frontend',
          target_type: 'repository',
          target_value: null,
          created_at: '2026-03-25T00:01:00Z',
        },
      ],
    })

    expect(
      taskStore.listOpenScanSuggestionRepositoryIds({
        projectId: 'project:/Users/program/code/foxpilot-workspace',
      }),
    ).toEqual(['repository:/Users/program/code/foxpilot-workspace:.'])

    db.close?.()
  })
})
