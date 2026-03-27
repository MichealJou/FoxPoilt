/**
 * @file src/db/connect.ts
 * @author michaeljou
 */

import Database from 'better-sqlite3'

/**
 * 持久化层统一使用的 SQLite 连接类型。
 */
export type SqliteDatabase = Database.Database

/**
 * 打开一个同步 SQLite 连接。
 */
export function connectDb(dbPath: string): SqliteDatabase {
  return new Database(dbPath)
}
