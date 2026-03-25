/**
 * @file src/db/connect.ts
 * @author michaeljou
 */

import Database from 'better-sqlite3'

/**
 * Concrete SQLite handle type used across the persistence layer.
 */
export type SqliteDatabase = Database.Database

/**
 * Opens a synchronous SQLite connection.
 */
export function connectDb(dbPath: string): SqliteDatabase {
  return new Database(dbPath)
}
