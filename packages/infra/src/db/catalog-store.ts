/**
 * @file src/db/catalog-store.ts
 * @author michaeljou
 */

import type { SqliteDatabase } from '@infra/db/connect.js'

/**
 * `workspace_root` 索引表的行模型。
 *
 * 这张表描述的是“工作区边界”，不是具体项目。
 */
export type WorkspaceRootRow = {
  /** 基于绝对路径生成的稳定主键，确保同一工作区不会被重复登记。 */
  id: string
  /** 面向用户展示的工作区名称，通常由路径末段生成。 */
  name: string
  /** 工作区根目录的绝对路径，是路径匹配和归属判定的核心字段。 */
  path: string
  /** SQLite 兼容布尔位，表示当前工作区是否仍被启用。 */
  enabled: number
  /** 预留的描述字段，方便后续为工作区追加人工说明。 */
  description: string | null
  /** 首次登记该工作区时的 ISO 时间戳。 */
  created_at: string
  /** 最近一次更新该工作区记录时的 ISO 时间戳。 */
  updated_at: string
}

/**
 * `project` 索引表的行模型。
 *
 * 这张表描述的是“某个工作区下有哪些项目”，并承担项目定位与归属关系的持久化职责。
 */
export type ProjectRow = {
  /** 项目主键，当前采用 `project:<absolute-path>` 的合成规则。 */
  id: string
  /** 所属工作区主键，用于表达项目归属。 */
  workspace_root_id: string
  /** 机器友好的项目名称。 */
  name: string
  /** 人类可读的显示名称，允许为空。 */
  display_name: string | null
  /** 项目根目录绝对路径，是项目解析时最关键的定位字段。 */
  root_path: string
  /** 项目来源，例如手动登记或自动发现。 */
  source_type: 'manual' | 'auto_discovered'
  /** 项目在 FoxPilot 中的当前状态。 */
  status: 'pending' | 'managed' | 'disabled' | 'archived'
  /** 预留的项目描述字段。 */
  description: string | null
  /** 项目首次写入索引时的时间。 */
  created_at: string
  /** 项目最近一次被刷新或更新时的时间。 */
  updated_at: string
}

/**
 * `repository` 索引表的行模型。
 *
 * 这张表保存项目内部仓库的全局索引视图，供任务目标和后续扫描能力复用。
 */
export type RepositoryRow = {
  /** 仓库主键，当前采用 `repository:<project-root>:<relative-path>` 规则生成。 */
  id: string
  /** 所属项目主键。 */
  project_id: string
  /** 仓库稳定名称。 */
  name: string
  /** 人类可读显示名称，允许为空。 */
  display_name: string | null
  /** 相对项目根目录的路径。 */
  path: string
  /** 仓库分类，用于区分 Git 仓库、普通目录和子仓库。 */
  repo_type: 'git' | 'directory' | 'subrepo'
  /** 语言栈摘要，当前阶段允许为空。 */
  language_stack: string | null
  /** SQLite 兼容布尔位，表示仓库是否启用。 */
  enabled: number
  /** 首次写入索引的时间。 */
  created_at: string
  /** 最近一次刷新仓库索引的时间。 */
  updated_at: string
}

/**
 * 保持索引表同步所需的最小写入载荷。
 *
 * 设计逻辑：
 * 1. 以“工作区 + 项目 + 仓库列表”作为一次完整写入单元。
 * 2. 调用方只要提供这份结构，就能用事务一次性刷新索引状态。
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
 * 创建一个带事务封装 upsert 语义的索引存储对象。
 *
 * 设计逻辑：
 * 1. `workspace_root` 和 `project` 使用 upsert，保证重复初始化时可以刷新元信息。
 * 2. `repository` 采用“先删后插”而不是逐行 upsert，避免旧仓库残留。
 * 3. 所有跨表写入都包在事务里，保证索引状态要么整体成功，要么整体回滚。
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

  /**
   * 设计逻辑：
   * 1. 一次项目 upsert 被视为一次完整刷新。
   * 2. 因此这里先更新工作区和项目，再整体替换仓库列表，避免索引中混入旧仓库记录。
   */
  const upsertProjectCatalogTx = db.transaction((input: ProjectCatalogInput) => {
    upsertWorkspaceRootStmt.run(input.workspaceRoot)
    upsertProjectStmt.run(input.project)
    deleteProjectRepositoriesStmt.run(input.project.id)

    for (const repository of input.repositories) {
      insertRepositoryStmt.run(repository)
    }
  })

  /**
   * 设计逻辑：
   * 1. 删除项目索引时要同步删除仓库索引。
   * 2. 如果工作区下面已经没有任何项目，则把孤儿工作区一并清掉，避免脏数据堆积。
   */
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
