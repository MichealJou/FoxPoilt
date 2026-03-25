/**
 * @file src/db/bootstrap.ts
 * @author michaeljou
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { connectDb, type SqliteDatabase } from '@/db/connect.js'

/**
 * 解析仓库内置的 Schema 文件，用于初始化新的 FoxPilot 数据库。
 */
function resolveSchemaPath(): string {
  return path.resolve(process.cwd(), 'docs/specs/sql/foxpilot-phase1-init.sql')
}

/**
 * 打开 SQLite 数据库并执行完整的 Schema 初始化脚本。
 */
export async function bootstrapDatabase(dbPath: string): Promise<SqliteDatabase> {
  const db = connectDb(dbPath)
  const schema = await readFile(resolveSchemaPath(), 'utf8')

  db.exec(schema)

  return db
}
