import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '../helpers/tmp-dir.js'

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
  listTasks: (input: {
    projectId: string
    status?: 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'
  }) => Array<{
    id: string
    title: string
    status: string
    priority: string
    task_type: string
  }>
  getTaskById: (input: {
    projectId: string
    taskId: string
  }) => {
    id: string
    title: string
    status: string
  } | null
  updateTaskStatus: (input: {
    projectId: string
    taskId: string
    status: 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'
    updatedAt: string
  }) => boolean
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
  const bootstrap = await import('../../src/db/bootstrap.js')
  const catalogStore = await import('../../src/db/catalog-store.js')
  const taskStore = await import('../../src/db/task-store.js')

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
})
