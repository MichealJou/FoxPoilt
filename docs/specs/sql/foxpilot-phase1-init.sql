PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspace_root (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(path)
);

CREATE TABLE IF NOT EXISTS project (
  id TEXT PRIMARY KEY,
  workspace_root_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  root_path TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('auto_discovered', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'managed', 'disabled', 'archived')),
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(root_path),
  FOREIGN KEY (workspace_root_id) REFERENCES workspace_root(id)
);

CREATE TABLE IF NOT EXISTS repository (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  path TEXT NOT NULL,
  repo_type TEXT NOT NULL CHECK (repo_type IN ('git', 'directory', 'subrepo')),
  language_stack TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, path),
  FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE TABLE IF NOT EXISTS task (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'beads_sync', 'scan_suggestion')),
  status TEXT NOT NULL CHECK (
    status IN (
      'todo',
      'analyzing',
      'awaiting_plan_confirm',
      'executing',
      'awaiting_result_confirm',
      'done',
      'blocked',
      'cancelled'
    )
  ),
  priority TEXT NOT NULL DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  task_type TEXT NOT NULL DEFAULT 'generic' CHECK (
    task_type IN ('generic', 'frontend', 'backend', 'cross_repo', 'docs', 'init')
  ),
  execution_mode TEXT NOT NULL DEFAULT 'manual' CHECK (
    execution_mode IN ('manual', 'semi_auto', 'auto')
  ),
  requires_plan_confirm INTEGER NOT NULL DEFAULT 1 CHECK (requires_plan_confirm IN (0, 1)),
  current_executor TEXT NOT NULL DEFAULT 'none' CHECK (
    current_executor IN ('codex', 'beads', 'none')
  ),
  external_source TEXT,
  external_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE TABLE IF NOT EXISTS task_target (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  repository_id TEXT,
  target_type TEXT NOT NULL CHECK (
    target_type IN ('repository', 'module', 'directory', 'file_group')
  ),
  target_value TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE,
  FOREIGN KEY (repository_id) REFERENCES repository(id),
  CHECK (
    NOT (target_type = 'repository' AND repository_id IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS task_run (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  run_type TEXT NOT NULL CHECK (run_type IN ('analysis', 'execution', 'verification')),
  executor TEXT NOT NULL CHECK (executor IN ('codex', 'manual', 'future_reserved')),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  summary TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_config (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, config_key),
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_workspace_root_id
ON project(workspace_root_id);

CREATE INDEX IF NOT EXISTS idx_repository_project_id
ON repository(project_id);

CREATE INDEX IF NOT EXISTS idx_task_project_id
ON task(project_id);

CREATE INDEX IF NOT EXISTS idx_task_status_priority
ON task(status, priority);

CREATE INDEX IF NOT EXISTS idx_task_updated_at
ON task(updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_external_ref
ON task(project_id, external_source, external_id)
WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_target_task_id
ON task_target(task_id);

CREATE INDEX IF NOT EXISTS idx_task_target_repository_id
ON task_target(repository_id);

CREATE INDEX IF NOT EXISTS idx_task_run_task_id
ON task_run(task_id);

CREATE INDEX IF NOT EXISTS idx_task_run_task_started_at
ON task_run(task_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_config_project_id
ON project_config(project_id);
