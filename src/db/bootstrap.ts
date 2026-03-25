/**
 * @file src/db/bootstrap.ts
 * @author michaeljou
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { connectDb, type SqliteDatabase } from '@/db/connect.js'

/**
 * Resolves the checked-in schema used to bootstrap new FoxPilot databases.
 */
function resolveSchemaPath(): string {
  return path.resolve(process.cwd(), 'docs/specs/sql/foxpilot-phase1-init.sql')
}

/**
 * Opens the SQLite database and executes the full schema bootstrap script.
 */
export async function bootstrapDatabase(dbPath: string): Promise<SqliteDatabase> {
  const db = connectDb(dbPath)
  const schema = await readFile(resolveSchemaPath(), 'utf8')

  db.exec(schema)

  return db
}
