import Database from 'better-sqlite3'

export type SqliteDatabase = Database.Database

export function connectDb(dbPath: string): SqliteDatabase {
  return new Database(dbPath)
}
