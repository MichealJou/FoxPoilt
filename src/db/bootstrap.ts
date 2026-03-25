import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { connectDb, type SqliteDatabase } from './connect.js'

function resolveSchemaPath(): string {
  return path.resolve(process.cwd(), 'docs/specs/sql/foxpilot-phase1-init.sql')
}

export async function bootstrapDatabase(dbPath: string): Promise<SqliteDatabase> {
  const db = connectDb(dbPath)
  const schema = await readFile(resolveSchemaPath(), 'utf8')

  db.exec(schema)

  return db
}
