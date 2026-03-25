/**
 * @file src/db/catalog-store.ts
 * @author michaeljou
 */

import type { SqliteDatabase } from '@/db/connect.js'

/**
 * Row model for the `workspace_root` catalog table.
 */
export type WorkspaceRootRow = {
  /** Stable synthetic identifier derived from the absolute path. */
  id: string
  /** Display name shown in CLI output. */
  name: string
  /** Absolute workspace root path. */
  path: string
  /** SQLite-compatible boolean flag. */
  enabled: number
  /** Optional free-form description. */
  description: string | null
  /** ISO timestamp of initial creation. */
  created_at: string
  /** ISO timestamp of the latest mutation. */
  updated_at: string
}

/**
 * Row model for the `project` catalog table.
 */
export type ProjectRow = {
  id: string
  workspace_root_id: string
  name: string
  display_name: string | null
  root_path: string
  source_type: 'manual' | 'auto_discovered'
  status: 'pending' | 'managed' | 'disabled' | 'archived'
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Row model for the `repository` catalog table.
 */
export type RepositoryRow = {
  id: string
  project_id: string
  name: string
  display_name: string | null
  path: string
  repo_type: 'git' | 'directory' | 'subrepo'
  language_stack: string | null
  enabled: number
  created_at: string
  updated_at: string
}

/**
 * Minimal write payload for keeping the catalog tables in sync.
 */
export type ProjectCatalogInput = {
  workspaceRoot: WorkspaceRootRow
  project: ProjectRow
  repositories: RepositoryRow[]
}

function countRows(db: SqliteDatabase, tableName: 'workspace_root' | 'project' | 'repository'): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number }
  return row.count
}

/**
 * Creates a catalog store with transaction-wrapped upsert semantics.
 */
export function createCatalogStore(db: SqliteDatabase) {
  const upsertWorkspaceRootStmt = db.prepare(`
    INSERT INTO workspace_root (
      id, name, path, enabled, description, created_at, updated_at
    ) VALUES (
      @id, @name, @path, @enabled, @description, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      path = excluded.path,
      enabled = excluded.enabled,
      description = excluded.description,
      updated_at = excluded.updated_at
  `)

  const upsertProjectStmt = db.prepare(`
    INSERT INTO project (
      id, workspace_root_id, name, display_name, root_path, source_type, status, description, created_at, updated_at
    ) VALUES (
      @id, @workspace_root_id, @name, @display_name, @root_path, @source_type, @status, @description, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      workspace_root_id = excluded.workspace_root_id,
      name = excluded.name,
      display_name = excluded.display_name,
      root_path = excluded.root_path,
      source_type = excluded.source_type,
      status = excluded.status,
      description = excluded.description,
      updated_at = excluded.updated_at
  `)

  const deleteProjectRepositoriesStmt = db.prepare(`
    DELETE FROM repository
    WHERE project_id = ?
  `)

  const deleteProjectStmt = db.prepare(`
    DELETE FROM project
    WHERE id = ?
  `)

  const deleteWorkspaceRootIfOrphanStmt = db.prepare(`
    DELETE FROM workspace_root
    WHERE id = ?
      AND NOT EXISTS (
        SELECT 1
        FROM project
        WHERE workspace_root_id = ?
      )
  `)

  const insertRepositoryStmt = db.prepare(`
    INSERT INTO repository (
      id, project_id, name, display_name, path, repo_type, language_stack, enabled, created_at, updated_at
    ) VALUES (
      @id, @project_id, @name, @display_name, @path, @repo_type, @language_stack, @enabled, @created_at, @updated_at
    )
  `)

  const replaceProjectRepositoriesTx = db.transaction((projectId: string, repositories: RepositoryRow[]) => {
    deleteProjectRepositoriesStmt.run(projectId)

    for (const repository of repositories) {
      insertRepositoryStmt.run(repository)
    }
  })

  // Project upsert replaces repository rows as a unit so the catalog never
  // mixes repositories from different scans or init attempts.
  const upsertProjectCatalogTx = db.transaction((input: ProjectCatalogInput) => {
    upsertWorkspaceRootStmt.run(input.workspaceRoot)
    upsertProjectStmt.run(input.project)
    deleteProjectRepositoriesStmt.run(input.project.id)

    for (const repository of input.repositories) {
      insertRepositoryStmt.run(repository)
    }
  })

  // Cleanup is also transactional so rollback paths can remove partial catalog
  // state created during init failures.
  const deleteProjectCatalogTx = db.transaction((projectId: string, workspaceRootId: string) => {
    deleteProjectRepositoriesStmt.run(projectId)
    deleteProjectStmt.run(projectId)
    deleteWorkspaceRootIfOrphanStmt.run(workspaceRootId, workspaceRootId)
  })

  return {
    upsertWorkspaceRoot(input: WorkspaceRootRow): void {
      upsertWorkspaceRootStmt.run(input)
    },
    upsertProject(input: ProjectRow): void {
      upsertProjectStmt.run(input)
    },
    replaceProjectRepositories(projectId: string, repositories: RepositoryRow[]): void {
      replaceProjectRepositoriesTx(projectId, repositories)
    },
    upsertProjectCatalog(input: ProjectCatalogInput): void {
      upsertProjectCatalogTx(input)
    },
    deleteProjectCatalog(projectId: string, workspaceRootId: string): void {
      deleteProjectCatalogTx(projectId, workspaceRootId)
    },
    countWorkspaceRoots(): number {
      return countRows(db, 'workspace_root')
    },
    countProjects(): number {
      return countRows(db, 'project')
    },
    countRepositories(): number {
      return countRows(db, 'repository')
    },
  }
}
