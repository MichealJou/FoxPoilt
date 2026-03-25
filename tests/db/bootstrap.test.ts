import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '../helpers/tmp-dir.js'

type DatabaseLike = {
  prepare: (sql: string) => {
    all: () => Array<{ name: string }>
  }
  close?: () => void
}

type BootstrapDatabase = (dbPath: string) => Promise<DatabaseLike> | DatabaseLike

async function loadBootstrapModule(): Promise<{
  bootstrapDatabase: BootstrapDatabase
}> {
  try {
    return await import('../../src/db/bootstrap.js')
  } catch {
    return {
      bootstrapDatabase: async () => ({
        prepare: () => ({
          all: () => [],
        }),
      }),
    }
  }
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

describe('db bootstrap', () => {
  it('creates all phase1 tables in foxpilot.db', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const { bootstrapDatabase } = await loadBootstrapModule()

    const db = await bootstrapDatabase(dbPath)
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()

    expect(tables.map((item) => item.name)).toContain('workspace_root')
    expect(tables.map((item) => item.name)).toContain('task_run')

    db.close?.()
  })
})
