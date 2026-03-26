# FoxPilot 第一阶段 SQLite 表结构草案

## 1. 目标

这份草案用于把当前第一阶段的产品规格和通用数据模型，落成一版可以执行的 SQLite 结构设计。

本草案只解决第一阶段需要的最小持久化问题：

- 工作区根目录管理
- 项目与仓库挂载
- 任务归属与目标范围
- 任务运行历史
- 项目级配置覆盖

本草案暂不进入：

- 真实代码实现
- ORM 映射细节
- 迁移脚本
- 复杂全文检索
- 多用户与权限模型

## 2. 方案选择

SQLite 落地有三种常见做法：

### 2.1 全部配置都进 SQLite

优点：

- 单一存储源
- 查询方便

缺点：

- 不利于人工阅读和迁移
- 与当前 `.json` 配置思路冲突

### 2.2 全部只放文件，不建 SQLite

优点：

- 简单
- 对人类友好

缺点：

- 不适合任务列表、筛选、统计和运行历史查询
- 后续桌面端很快会受限

### 2.3 文件配置 + SQLite 运行态

这是本草案采用的方案。

原则是：

- 可读配置继续保留在文件里
- 列表、索引、历史记录进入 SQLite
- `project_config` 表只保存项目级覆盖项或导入后的键值展开

这样既不丢掉可读性，也能为后续桌面端和任务中控提供稳定数据底座。

## 3. 基础约定

### 3.1 命名

- 表名统一使用 snake_case
- 字段名统一使用 snake_case
- 与当前数据模型文档保持一致

### 3.2 主键

第一阶段统一建议使用 `TEXT` 主键。

原因：

- 本地工具不依赖数据库自增序列
- 更容易兼容后续导入、导出、同步
- 适合使用 `ulid` 或 `uuid`

本草案不强制规定生成器，只规定数据库类型为 `TEXT`。

### 3.3 时间字段

时间字段统一使用 `TEXT`，保存 ISO-8601 UTC 字符串，例如：

- `2026-03-25T08:00:00Z`

原因：

- SQLite 没有强类型时间列
- 文本时间更利于调试和导出
- 与 JSON 配置和日志格式一致

### 3.4 布尔字段

布尔统一使用 `INTEGER`：

- `1` 表示 true
- `0` 表示 false

### 3.5 枚举字段

第一阶段先用 `TEXT + CHECK` 约束，不单独拆枚举表。

原因：

- 结构更简单
- 便于后续版本扩展

### 3.6 删除策略

第一阶段以安全优先：

- 不设计用户侧“物理删除”主流程
- 关系约束尽量使用显式外键
- 强依赖历史表可使用级联删除

## 4. 表结构总览

第一阶段建议落 7 张主表：

1. `workspace_root`
2. `project`
3. `repository`
4. `task`
5. `task_target`
6. `task_run`
7. `project_config`

说明：

- 这与当前数据模型文档保持一致
- 第一阶段不新增 `task_draft`
- 任务当前态放在 `task`
- 任务历史放在 `task_run`

## 5. 详细表设计

### 5.1 workspace_root

用途：

- 保存本地扫描入口

建议 SQL：

```sql
CREATE TABLE workspace_root (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(path)
);
```

字段说明：

- `path` 全局唯一，避免重复接管同一路径
- `enabled` 控制该根目录是否参与扫描

### 5.2 project

用途：

- 保存 FoxPilot 接管的项目

建议 SQL：

```sql
CREATE TABLE project (
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
```

字段说明：

- `root_path` 唯一，表示一个项目只接管一次
- `workspace_root_id` 说明项目属于哪个扫描根目录

### 5.3 repository

用途：

- 保存项目下的具体仓库或代码目录

建议 SQL：

```sql
CREATE TABLE repository (
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
```

字段说明：

- `path` 建议保存项目根路径下的相对路径
- `language_stack` 第一阶段先用文本保存，不单独拆表

### 5.4 task

用途：

- 保存任务当前态

建议 SQL：

```sql
CREATE TABLE task (
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
```

字段说明：

- `task` 只保存当前状态，不保存完整执行历史
- `current_executor` 只表达当前责任执行器
- 多次分析、执行、验证历史统一进入 `task_run`
- `external_source` 和 `external_id` 用于最小外部同步幂等键
- 手工任务允许 `external_source` / `external_id` 为空

### 5.5 task_target

用途：

- 描述任务作用范围

建议 SQL：

```sql
CREATE TABLE task_target (
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
```

字段说明：

- 项目级任务允许没有任何 `task_target`
- `repository` 类型必须绑定 `repository_id`
- `module`、`directory`、`file_group` 可以使用 `target_value`

### 5.6 task_run

用途：

- 保存任务历史运行记录

建议 SQL：

```sql
CREATE TABLE task_run (
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
```

字段说明：

- 这张表是第一阶段最关键的历史记录表
- 它承担分析、执行、验证三类运行历史
- 后续若需要日志路径、结果 JSON、错误详情，可优先在这张表扩展字段

### 5.7 project_config

用途：

- 保存项目级覆盖配置

建议 SQL：

```sql
CREATE TABLE project_config (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, config_key),
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);
```

字段说明：

- 第一阶段先保持简单键值结构
- 不在这里直接塞复杂对象关系
- 如果未来出现稳定 JSON 结构，再考虑升级

## 6. 索引建议

建议至少补这些索引：

```sql
CREATE INDEX idx_project_workspace_root_id
ON project(workspace_root_id);

CREATE INDEX idx_repository_project_id
ON repository(project_id);

CREATE INDEX idx_task_project_id
ON task(project_id);

CREATE INDEX idx_task_status_priority
ON task(status, priority);

CREATE INDEX idx_task_updated_at
ON task(updated_at);

CREATE INDEX idx_task_target_task_id
ON task_target(task_id);

CREATE INDEX idx_task_target_repository_id
ON task_target(repository_id);

CREATE INDEX idx_task_run_task_id
ON task_run(task_id);

CREATE INDEX idx_task_run_task_started_at
ON task_run(task_id, started_at DESC);

CREATE INDEX idx_project_config_project_id
ON project_config(project_id);
```

## 7. 关系与边界说明

### 7.1 当前态与历史态分层

第一阶段固定采用以下分层：

- `task` 承载当前态
- `task_run` 承载历史态

这样做的好处是：

- 列表查询简单
- 状态筛选简单
- 历史追溯独立

### 7.2 项目与仓库边界

第一阶段固定保持：

- 项目是任务默认归属
- 仓库只是目标范围

因此：

- `task.project_id` 必填
- `task_target.repository_id` 可选

### 7.3 配置边界

第一阶段建议保持双层：

- 文件配置负责可读、可迁移
- SQLite 负责运行态索引和项目级覆盖项

因此当前不建议把 `foxpilot.config.json` 直接替换成数据库表。

## 8. 暂不进入第一阶段的表

以下表结构暂不新增：

- `task_draft`
- `executor_policy`
- `task_comment`
- `task_attachment`
- `memory_entry`
- `scan_result`
- `beads_mapping`

这些内容要么尚未稳定，要么会把第一阶段复杂度抬得过高。

## 9. 初始化与迁移建议

第一阶段初始化顺序建议为：

1. 创建基础表
2. 创建索引
3. 初始化 `workspace_root`
4. 导入项目与仓库
5. 后续再写入 `task` 与 `task_run`

如果后续进入实现阶段，建议保留一个初始化 SQL 文件，例如：

- `docs/specs/sql/foxpilot-phase1-init.sql`

当前阶段先不生成该文件，先把结构设计定住。

## 10. 当前结论

第一阶段 SQLite 先收敛为 7 张主表，重点保证：

- 任务归属在项目层
- 任务范围通过 `task_target` 表示
- 任务历史统一沉淀到 `task_run`
- 项目配置保持简单键值结构
- 文件配置与 SQLite 运行态并存，不强行合并

这套结构已经足够支撑下一步的：

1. 初始化 SQL 草案
2. `FoxPilot init` 输入输出设计
3. 桌面端列表视图与筛选视图设计
