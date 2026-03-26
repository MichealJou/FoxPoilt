/**
 * @file src/db/bootstrap.ts
 * @author michaeljou
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectDb, type SqliteDatabase } from '@/db/connect.js'

/**
 * 解析仓库内置的 Schema 文件，用于初始化新的 FoxPilot 数据库。
 *
 * 这里不能依赖 `process.cwd()`，因为：
 * - 在仓库根目录直接运行时，`cwd` 碰巧能命中 schema；
 * - 但一旦作为依赖包或全局 CLI 安装，调用目录就不再等于包根目录；
 * - 继续依赖 `cwd` 会导致“命令能启动，但 init 无法建库”这种安装后故障。
 *
 * 因此这里改为以当前模块文件为基准回溯到包根目录，再定位文档里的 SQL 真源。
 */
function resolveSchemaPath(): string {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(moduleDir, '../../docs/specs/sql/foxpilot-phase1-init.sql')
}

type TableColumnInfoRow = {
  name: string
}

function tableExists(db: SqliteDatabase, tableName: string): boolean {
  const row = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name = ?
    LIMIT 1
  `).get(tableName) as { name: string } | undefined

  return row !== undefined
}

function listTableColumns(db: SqliteDatabase, tableName: string): string[] {
  return (
    db.prepare(`PRAGMA table_info(${tableName})`).all() as TableColumnInfoRow[]
  ).map((row) => row.name)
}

/**
 * 为老版本数据库补齐外部同步字段。
 *
 * 之前的 `task` 表没有外部来源键，导致新版本虽然能执行 `CREATE TABLE IF NOT EXISTS`，
 * 但不会自动把新列补进去。这里显式做一次增量迁移，保证升级后旧库也能继续使用。
 */
function ensureTaskExternalReferenceColumns(db: SqliteDatabase): void {
  const taskColumns = new Set(listTableColumns(db, 'task'))

  if (!taskColumns.has('external_source')) {
    db.exec('ALTER TABLE task ADD COLUMN external_source TEXT;')
  }

  if (!taskColumns.has('external_id')) {
    db.exec('ALTER TABLE task ADD COLUMN external_id TEXT;')
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_task_external_ref
    ON task(project_id, external_source, external_id)
    WHERE external_source IS NOT NULL AND external_id IS NOT NULL;
  `)
}

/**
 * 打开 SQLite 数据库并执行完整的 Schema 初始化脚本。
 */
export async function bootstrapDatabase(dbPath: string): Promise<SqliteDatabase> {
  const db = connectDb(dbPath)
  const schema = await readFile(resolveSchemaPath(), 'utf8')

  /**
   * 兼容老版本数据库：
   * - 如果旧库里已经有 `task` 表，但还没有新列；
   * - 需要先补列，再执行包含新索引的 schema；
   * - 否则 `CREATE INDEX ... external_id` 会在老库上直接失败。
   */
  if (tableExists(db, 'task')) {
    ensureTaskExternalReferenceColumns(db)
  }

  db.exec(schema)
  ensureTaskExternalReferenceColumns(db)

  return db
}
