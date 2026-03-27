import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

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
    return await import('@foxpilot/infra/db/bootstrap.js')
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
const originalCwd = process.cwd()

afterEach(async () => {
  process.chdir(originalCwd)
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

describe('db bootstrap', () => {
  it('creates all phase1 tables in foxpilot.db', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const { bootstrapDatabase } = await loadBootstrapModule()

    /**
     * 故意切到临时目录执行，用来验证 schema 定位不依赖当前工作目录。
     * 这样可以覆盖“作为已安装 CLI 在任意目录执行”的真实场景。
     */
    process.chdir(tempDir)

    const db = await bootstrapDatabase(dbPath)
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()

    expect(tables.map((item) => item.name)).toContain('workspace_root')
    expect(tables.map((item) => item.name)).toContain('task_run')

    db.close?.()
  })

  it('adds external task reference columns when bootstrapping an old database', async () => {
    const tempDir = await createTempDir('foxpilot-db-')
    tempDirs.push(tempDir)
    const dbPath = `${tempDir}/foxpilot.db`
    const legacyDb = new Database(dbPath)

    legacyDb.exec(`
      CREATE TABLE task (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        source_type TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'P2',
        task_type TEXT NOT NULL DEFAULT 'generic',
        execution_mode TEXT NOT NULL DEFAULT 'manual',
        requires_plan_confirm INTEGER NOT NULL DEFAULT 1,
        current_executor TEXT NOT NULL DEFAULT 'none',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)
    legacyDb.close()

    const { bootstrapDatabase } = await loadBootstrapModule()
    const db = await bootstrapDatabase(dbPath)
    const columns = db.prepare("PRAGMA table_info(task)").all() as Array<{ name: string }>

    expect(columns.map((item) => item.name)).toContain('external_source')
    expect(columns.map((item) => item.name)).toContain('external_id')

    db.close?.()
  })
})
