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

/**
 * 打开 SQLite 数据库并执行完整的 Schema 初始化脚本。
 */
export async function bootstrapDatabase(dbPath: string): Promise<SqliteDatabase> {
  const db = connectDb(dbPath)
  const schema = await readFile(resolveSchemaPath(), 'utf8')

  db.exec(schema)

  return db
}
