import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

type CatalogStore = {
  upsertWorkspaceRoot: (input: {
    id: string
    name: string
    path: string
    enabled: number
    description: string | null
    created_at: string
    updated_at: string
  }) => void
  upsertProject: (input: {
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
  }) => void
  replaceProjectRepositories: (
    projectId: string,
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
    }>,
  ) => void
  countWorkspaceRoots: () => number
  countProjects: () => number
  countRepositories: () => number
}

type DatabaseLike = {
  close?: () => void
}

type BootstrapDatabase = (dbPath: string) => Promise<DatabaseLike> | DatabaseLike

async function loadModules(): Promise<{
  bootstrapDatabase: BootstrapDatabase
  createCatalogStore: (db: unknown) => CatalogStore
}> {
  try {
    const bootstrap = await import('@infra/db/bootstrap.js')
    const store = await import('@infra/db/catalog-store.js')

    return {
      bootstrapDatabase: bootstrap.bootstrapDatabase,
      createCatalogStore: store.createCatalogStore as unknown as (db: unknown) => CatalogStore,
    }
  } catch {
    return {
      bootstrapDatabase: async () => ({}),
      createCatalogStore: () => ({
        upsertWorkspaceRoot: () => undefined,
        upsertProject: () => undefined,
        replaceProjectRepositories: () => undefined,
        countWorkspaceRoots: () => 0,
        countProjects: () => 0,
        countRepositories: () => 0,
      }),
    }
  }
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

describe('catalog store', () => {
  it('upserts workspace root, project and repositories idempotently', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const { bootstrapDatabase, createCatalogStore } = await loadModules()
    const now = '2026-03-25T00:00:00Z'

    const db = await bootstrapDatabase(dbPath)
    const store = createCatalogStore(db)

    store.upsertWorkspaceRoot({
      id: 'wr-1',
      name: 'code',
      path: '/Users/program/code',
      enabled: 1,
      description: null,
      created_at: now,
      updated_at: now,
    })
    store.upsertWorkspaceRoot({
      id: 'wr-1',
      name: 'code',
      path: '/Users/program/code',
      enabled: 1,
      description: null,
      created_at: now,
      updated_at: now,
    })

    store.upsertProject({
      id: 'project-1',
      workspace_root_id: 'wr-1',
      name: 'foxpilot',
      display_name: 'FoxPilot',
      root_path: '/Users/program/code/foxpilot-workspace',
      source_type: 'manual',
      status: 'managed',
      description: null,
      created_at: now,
      updated_at: now,
    })

    store.replaceProjectRepositories('project-1', [
      {
        id: 'repo-1',
        project_id: 'project-1',
        name: 'root',
        display_name: 'Root',
        path: '.',
        repo_type: 'directory',
        language_stack: '',
        enabled: 1,
        created_at: now,
        updated_at: now,
      },
    ])

    store.replaceProjectRepositories('project-1', [
      {
        id: 'repo-2',
        project_id: 'project-1',
        name: 'frontend',
        display_name: 'Frontend',
        path: 'frontend',
        repo_type: 'git',
        language_stack: 'node-pnpm',
        enabled: 1,
        created_at: now,
        updated_at: now,
      },
    ])

    expect(store.countWorkspaceRoots()).toBe(1)
    expect(store.countProjects()).toBe(1)
    expect(store.countRepositories()).toBe(1)

    db.close?.()
  })
})
