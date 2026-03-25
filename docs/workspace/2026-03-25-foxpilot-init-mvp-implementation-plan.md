# FoxPilot Init MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成 `Task 1` 到 `Task 9` 的实现与验证
- 已实现 `foxpilot init` 与 `fp init`
- 已覆盖非交互初始化、交互确认、失败补偿与错误码映射
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过（`6` 个测试文件，`24` 个测试）
- 提交步骤未执行，因为当前工作区不是 git 仓库

**Goal:** 构建第一版可运行的 `foxpilot init` CLI，并兼容短别名 `fp init`，能够生成项目本地配置、初始化全局配置与 SQLite，并把项目和仓库写入索引。

**Architecture:** 本计划只覆盖 `init` 这一个最小可运行闭环，不扩展到任务创建、任务执行或桌面端。实现上采用 `TypeScript + Node.js CLI`，把职责拆成命令层、配置层、仓库扫描层、SQLite 层和编排层，确保后续可以继续扩展命令与数据域。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

本计划默认当前仓库还是空实现状态，因此先约定一版最小文件结构：

- `package.json`
  - CLI 项目元数据、脚本、依赖
- `tsconfig.json`
  - TypeScript 编译配置
- `vitest.config.ts`
  - 测试配置
- `src/cli/main.ts`
  - CLI 入口
- `src/cli/parse-args.ts`
  - 参数解析
- `src/commands/init/init-command.ts`
  - `init` 命令编排入口
- `src/commands/init/init-types.ts`
  - `init` 参数与结果类型
- `src/core/paths.ts`
  - 全局目录和项目路径解析
- `src/core/json-file.ts`
  - JSON 读写工具
- `src/config/global-config.ts`
  - 全局配置默认值与读写
- `src/project/project-config.ts`
  - 项目配置结构与写入
- `src/project/scan-repositories.ts`
  - 一层仓库扫描
- `src/db/connect.ts`
  - SQLite 连接创建
- `src/db/bootstrap.ts`
  - 执行初始化 SQL
- `src/db/catalog-store.ts`
  - `workspace_root/project/repository` 写入与查询
- `tests/cli/init-command.test.ts`
  - CLI 命令级测试
- `tests/config/global-config.test.ts`
  - 全局配置测试
- `tests/project/project-config.test.ts`
  - 项目配置测试
- `tests/project/scan-repositories.test.ts`
  - 仓库扫描测试
- `tests/db/bootstrap.test.ts`
  - 数据库初始化测试
- `tests/db/catalog-store.test.ts`
  - 索引写入测试
- `tests/helpers/tmp-dir.ts`
  - 测试临时目录辅助
- `tests/helpers/run-cli.ts`
  - CLI 测试 harness，负责 stdin、cwd、homeDir 与故障注入
- `docs/specs/sql/foxpilot-phase1-init.sql`
  - 初始化 SQL 的唯一真源

说明：

- 当前计划不引入 ORM
- 当前计划不引入 Commander/Yargs 等大型 CLI 框架
- 当前计划优先保证路径、配置和数据库行为稳定
- 当前 MVP 不维护第二份运行时 schema 文件，避免 `docs` 与 `src` 双份 SQL 漂移

### Task 1: CLI 工程骨架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/cli/main.ts`
- Create: `src/cli/parse-args.ts`
- Test: `tests/cli/init-command.test.ts`
- Create: `tests/helpers/run-cli.ts`

- [ ] **Step 1: 写一个失败的 CLI 烟雾测试**

```ts
import { describe, expect, it } from 'vitest'

describe('foxpilot init CLI', () => {
  it('prints usage when called with --help', async () => {
    const output = await runCli(['init', '--help'])
    expect(output).toContain('foxpilot init')
  })

  it('accepts the fp alias', async () => {
    const output = await runCli(['init', '--help'], { binName: 'fp' })
    expect(output).toContain('foxpilot init')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/cli/init-command.test.ts`
Expected: FAIL，因为 CLI 入口和测试辅助都还不存在。

- [ ] **Step 3: 写最小 CLI 入口、参数解析器和测试 harness**

```ts
export function parseArgs(argv: string[]) {
  return { command: argv[0], help: argv.includes('--help') }
}

export async function main(argv: string[]) {
  const args = parseArgs(argv)
  if (args.command === 'init' && args.help) {
    return 'foxpilot init'
  }
  return 'unknown command'
}

type RunCliOptions = {
  binName?: 'foxpilot' | 'fp'
  cwd?: string
  homeDir?: string
  stdin?: string[]
  failEnsureGlobalConfig?: boolean
  failBootstrap?: boolean
  failUpsert?: boolean
  failWriteProjectConfig?: boolean
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest tests/cli/init-command.test.ts`
Expected: PASS，并确认 `foxpilot` 与 `fp` 都能进入同一命令入口。

- [ ] **Step 5: 提交骨架**

```bash
git add package.json tsconfig.json vitest.config.ts src/cli/main.ts src/cli/parse-args.ts tests/cli/init-command.test.ts tests/helpers/run-cli.ts
git commit -m "feat: bootstrap foxpilot cli skeleton"
```

### Task 2: 全局路径与全局配置读写

**Files:**
- Create: `src/core/paths.ts`
- Create: `src/core/json-file.ts`
- Create: `src/config/global-config.ts`
- Test: `tests/config/global-config.test.ts`
- Modify: `tests/helpers/tmp-dir.ts`

- [ ] **Step 1: 写一组失败的全局配置测试**

```ts
it('creates default global config under ~/.foxpilot', async () => {
  const result = await ensureGlobalConfig({ homeDir: tempHome })
  expect(result.configPath).toBe(`${tempHome}/.foxpilot/foxpilot.config.json`)
  expect(result.config.defaultExecutor).toBe('codex')
})

it('merges workspace roots without overwriting existing defaults', async () => {
  // 只合并 workspaceRoots，且去重
})

it('throws a typed error when global config json is malformed', async () => {
  // 约束退出码 3 的上游错误语义
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/config/global-config.test.ts`
Expected: FAIL，因为路径解析和 JSON 读写实现尚不存在。

- [ ] **Step 3: 实现路径与 JSON 工具**

```ts
export function resolveFoxpilotHome(homeDir: string) {
  return `${homeDir}/.foxpilot`
}

export function resolveGlobalConfigPath(homeDir: string) {
  return `${resolveFoxpilotHome(homeDir)}/foxpilot.config.json`
}
```

- [ ] **Step 4: 实现全局配置默认值、合并与损坏文件错误语义**

```ts
export const defaultGlobalConfig = {
  workspaceRoots: [],
  defaultProjectMode: 'workspace_root',
  defaultTaskView: 'table',
  defaultExecutor: 'codex',
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `pnpm vitest tests/config/global-config.test.ts`
Expected: PASS

- [ ] **Step 6: 补充“优先命中已有 workspace root”测试说明**

Run: `pnpm vitest tests/config/global-config.test.ts`
Expected: PASS，并明确暴露供 `init` 编排层复用的 workspace root 推断函数。

- [ ] **Step 7: 提交全局配置模块**

```bash
git add src/core/paths.ts src/core/json-file.ts src/config/global-config.ts tests/config/global-config.test.ts tests/helpers/tmp-dir.ts
git commit -m "feat: add global config bootstrap"
```

### Task 3: 项目本地配置结构与写入

**Files:**
- Create: `src/project/project-config.ts`
- Test: `tests/project/project-config.test.ts`

- [ ] **Step 1: 写一个失败的项目配置测试**

```ts
it('writes .foxpilot/project.json for the target project', async () => {
  const result = await writeProjectConfig({
    projectRoot,
    name: 'foxpilot-workspace',
    repositories: [{ name: 'root', path: '.', repoType: 'directory', languageStack: '' }],
  })
  expect(result.configPath).toBe(`${projectRoot}/.foxpilot/project.json`)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/project/project-config.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现项目配置类型和写入函数**

```ts
export interface ProjectConfig {
  name: string
  displayName: string
  rootPath: string
  status: 'managed'
  repositories: Array<{
    name: string
    path: string
    repoType: 'git' | 'directory' | 'subrepo'
    languageStack: string
  }>
}
```

- [ ] **Step 4: 增加已初始化保护测试并实现**

Run: `pnpm vitest tests/project/project-config.test.ts`
Expected: PASS，且重复写入默认报“已初始化”错误。

- [ ] **Step 5: 提交项目配置模块**

```bash
git add src/project/project-config.ts tests/project/project-config.test.ts
git commit -m "feat: add project config writer"
```

### Task 4: 仓库扫描器

**Files:**
- Create: `src/project/scan-repositories.ts`
- Test: `tests/project/scan-repositories.test.ts`
- Modify: `tests/helpers/tmp-dir.ts`

- [ ] **Step 1: 写一个失败的仓库扫描测试**

```ts
it('detects root and first-level git repositories', async () => {
  const repos = await scanRepositories(projectRoot)
  expect(repos.map((item) => item.path)).toContain('.')
  expect(repos.map((item) => item.path)).toContain('frontend')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/project/scan-repositories.test.ts`
Expected: FAIL

- [ ] **Step 3: 用临时目录和 `.git` 标记实现一层扫描**

```ts
export async function scanRepositories(projectRoot: string) {
  // 只检查项目根目录和一层子目录
  // 命中 `.git` 的目录视为 git 仓库
}
```

- [ ] **Step 4: 增加 `--no-scan` 对应的最小行为测试**

Run: `pnpm vitest tests/project/scan-repositories.test.ts`
Expected: PASS

- [ ] **Step 5: 提交仓库扫描器**

```bash
git add src/project/scan-repositories.ts tests/project/scan-repositories.test.ts tests/helpers/tmp-dir.ts
git commit -m "feat: add repository scanner"
```

### Task 5: SQLite 连接与初始化

**Files:**
- Create: `src/db/connect.ts`
- Create: `src/db/bootstrap.ts`
- Test: `tests/db/bootstrap.test.ts`
- Modify: `package.json`

- [ ] **Step 1: 写一个失败的数据库初始化测试**

```ts
it('creates all phase1 tables in foxpilot.db', async () => {
  const db = await bootstrapDatabase(dbPath)
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()
  expect(tables.map((t: any) => t.name)).toContain('workspace_root')
  expect(tables.map((t: any) => t.name)).toContain('task_run')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/db/bootstrap.test.ts`
Expected: FAIL，因为数据库连接和 schema 执行器还不存在。

- [ ] **Step 3: 引入 `better-sqlite3` 并实现连接创建**

```ts
import Database from 'better-sqlite3'

export function connectDb(dbPath: string) {
  return new Database(dbPath)
}
```

- [ ] **Step 4: 直接读取 `docs/specs/sql/foxpilot-phase1-init.sql` 作为唯一 schema 真源并实现 bootstrap**

Run: `pnpm vitest tests/db/bootstrap.test.ts`
Expected: PASS

- [ ] **Step 5: 提交 SQLite bootstrap**

```bash
git add package.json src/db/connect.ts src/db/bootstrap.ts tests/db/bootstrap.test.ts docs/specs/sql/foxpilot-phase1-init.sql
git commit -m "feat: add sqlite bootstrap"
```

### Task 6: 索引写入仓储层

**Files:**
- Create: `src/db/catalog-store.ts`
- Test: `tests/db/catalog-store.test.ts`

- [ ] **Step 1: 写一个失败的 upsert 测试**

```ts
it('upserts workspace root, project and repositories idempotently', () => {
  store.upsertWorkspaceRoot(workspaceRoot)
  store.upsertWorkspaceRoot(workspaceRoot)
  expect(store.countWorkspaceRoots()).toBe(1)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/db/catalog-store.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现三个最小 upsert 能力**

```ts
upsertWorkspaceRoot(...)
upsertProject(...)
replaceProjectRepositories(...)
```

- [ ] **Step 4: 增加项目重复初始化、仓库替换与查询测试**

Run: `pnpm vitest tests/db/catalog-store.test.ts`
Expected: PASS

- [ ] **Step 5: 提交索引仓储层**

```bash
git add src/db/catalog-store.ts tests/db/catalog-store.test.ts
git commit -m "feat: add catalog store upserts"
```

### Task 7: 失败恢复与补偿策略

**Files:**
- Modify: `src/commands/init/init-command.ts`
- Modify: `src/project/project-config.ts`
- Modify: `src/db/catalog-store.ts`
- Test: `tests/cli/init-command.test.ts`

- [ ] **Step 1: 写一组失败恢复测试**

```ts
it('does not leave partial init artifacts when sqlite bootstrap fails', async () => {
  const result = await runCli([
    'init',
    '--path', projectRoot,
    '--workspace-root', workspaceRoot,
    '--mode', 'non-interactive',
  ], { failBootstrap: true })

  expect(result.exitCode).toBe(4)
  expect(exists(`${projectRoot}/.foxpilot/project.json`)).toBe(false)
})

it('restores global config when index upsert fails after config merge', async () => {
  // failUpsert = true
  // 断言 global config 回到原内容
})

it('does not leave dirty db state when project config write fails', async () => {
  // failWriteProjectConfig = true
  // 断言索引事务已回滚或未提交
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/cli/init-command.test.ts`
Expected: FAIL

- [ ] **Step 3: 明确补偿顺序并实现**

```ts
// 建议顺序：
// 1. 读取并缓存旧 global config
// 2. bootstrap db
// 3. 事务内 upsert workspace/project/repository
// 4. 最后写 project.json
// 5. 若全局配置已改动但后续失败，则恢复旧内容或删除新文件
```

- [ ] **Step 4: 增加“全局配置已改动后失败”“索引写入失败”“project.json 写入失败”三类测试**

Run: `pnpm vitest tests/cli/init-command.test.ts`
Expected: PASS，并验证失败后没有语义不清的半初始化状态。

- [ ] **Step 5: 提交失败恢复策略**

```bash
git add src/commands/init/init-command.ts src/project/project-config.ts src/db/catalog-store.ts tests/cli/init-command.test.ts
git commit -m "feat: add init failure recovery"
```

### Task 8: `init` 非交互主流程

**Files:**
- Create: `src/commands/init/init-command.ts`
- Create: `src/commands/init/init-types.ts`
- Modify: `src/cli/main.ts`
- Modify: `src/cli/parse-args.ts`
- Test: `tests/cli/init-command.test.ts`

- [ ] **Step 1: 写一个失败的非交互集成测试**

```ts
it('initializes a project in non-interactive mode', async () => {
  const result = await runCli([
    'init',
    '--path', projectRoot,
    '--name', 'foxpilot',
    '--workspace-root', workspaceRoot,
    '--mode', 'non-interactive',
    '--no-scan',
  ])
  expect(result).toContain('[FoxPilot] 初始化完成')
})

it('initializes a project through the fp alias', async () => {
  const result = await runCli([
    'init',
    '--path', projectRoot,
    '--workspace-root', workspaceRoot,
    '--mode', 'non-interactive',
  ], { binName: 'fp' })
  expect(result).toContain('[FoxPilot] 初始化完成')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/cli/init-command.test.ts`
Expected: FAIL

- [ ] **Step 3: 组装非交互 init 编排**

```ts
// 顺序：
// 1. validate target path
// 2. infer workspace root from existing config or explicit arg
// 3. ensure global config
// 4. scan repositories or apply --no-scan
// 5. bootstrap db
// 6. transactional upsert indexes
// 7. write project config last
// 8. print three-phase success output
```

 - [ ] **Step 4: 增加 `--name`、`--no-scan`、`fp` 别名和三段式成功输出断言**

Run: `pnpm vitest tests/cli/init-command.test.ts`
Expected: PASS

- [ ] **Step 5: 提交 init 非交互闭环**

```bash
git add src/commands/init/init-command.ts src/commands/init/init-types.ts src/cli/main.ts src/cli/parse-args.ts tests/cli/init-command.test.ts
git commit -m "feat: add non-interactive init command"
```

### Task 9: `interactive` 模式与错误码收口

**Files:**
- Modify: `src/commands/init/init-command.ts`
- Modify: `src/commands/init/init-types.ts`
- Modify: `src/cli/main.ts`
- Test: `tests/cli/init-command.test.ts`

- [ ] **Step 1: 写一个默认 interactive 的失败测试**

```ts
it('defaults to interactive mode when --mode is omitted', async () => {
  const result = await runCli(['init'], { stdin: ['y', 'y', 'y', 'y', 'y'] })
  expect(result).toContain('是否使用这个目录初始化')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest tests/cli/init-command.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现最小 confirm 流程和退出码映射**

```ts
// 1 -> 通用失败
// 2 -> 已初始化
// 3 -> 全局配置损坏
// 4 -> SQLite 初始化失败
```

- [ ] **Step 4: 增加“已初始化”“路径不存在”“路径不是目录”“workspace root 非法”“损坏配置”“SQLite 失败”测试**

Run: `pnpm vitest tests/cli/init-command.test.ts`
Expected: PASS

- [ ] **Step 5: 运行全量测试**

Run: `pnpm vitest`
Expected: PASS

- [ ] **Step 6: 提交 MVP**

```bash
git add src/commands/init/init-command.ts src/commands/init/init-types.ts src/cli/main.ts tests/cli/init-command.test.ts
git commit -m "feat: complete foxpilot init mvp"
```

## 实施顺序说明

这份计划刻意按“先工具骨架，再文件配置，再数据库，再编排”的顺序推进。

原因是：

- CLI 项目没有骨架，后面的测试无法稳定承载
- `init` 的本质先是配置生成，不是数据库操作
- SQLite 需要独立验证，避免把数据库问题和命令问题混在一起
- 编排层最后再接起来，能减少定位成本

## 验证口径

MVP 完成后，必须满足以下口径：

1. `foxpilot init --help` 可用
2. `fp init --help` 可用
3. `foxpilot init --mode non-interactive` 能完成初始化
4. `fp init --mode non-interactive` 能完成初始化
5. 初始化后能生成 `<project-root>/.foxpilot/project.json`
6. 初始化后能生成或确认 `~/.foxpilot/foxpilot.config.json`
7. 初始化后能生成或确认 `~/.foxpilot/foxpilot.db`
8. `workspace_root/project/repository` 三张索引表写入成功
9. 重复初始化同一项目时，不会重复创建索引记录
10. `--name` 覆盖项目名时，项目配置与索引结果一致
11. `--no-scan` 开启时，不扫描子仓库
12. 默认不传 `--mode` 时进入 `interactive`
13. 损坏全局配置返回退出码 `3`
14. SQLite 初始化失败返回退出码 `4`
15. 初始化中途失败时，不留下语义不清的半初始化状态
16. 全局配置已改动后若后续失败，会恢复到失败前内容
17. `project.json` 写入失败时，不留下脏索引记录

## 风险与约束

- 当前计划基于 `TypeScript + Node.js` 假设，仅作用于实现计划，不自动变更产品规格
- 若后续决定改用 `Rust` 或其他 CLI 技术栈，需要重写文件级计划，但规格文档仍可复用
- 当前计划不覆盖桌面端，不覆盖任务创建，不覆盖 Beads 同步

## 交接说明

计划完成后，推荐按任务顺序执行，不要并行改动。

优先级固定为：

1. 骨架
2. 全局配置
3. 项目配置
4. 仓库扫描
5. SQLite
6. 索引 upsert
7. 失败恢复与补偿
8. 非交互 `init`
9. 交互模式与错误码
