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
    return await import('@/db/bootstrap.js')
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
})
