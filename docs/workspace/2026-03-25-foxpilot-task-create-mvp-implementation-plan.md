# FoxPilot Task Create MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成 `task create` MVP 的实现与验证
- 已支持 `foxpilot task create` 与 `fp task create`
- 已支持当前项目解析、`--path` 指定项目、仓库目标写入
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
- 提交步骤未执行，因为当前工作区不是 git 仓库

**Goal:** 构建第一版 `foxpilot task create` / `fp task create`，让用户可以把手动任务登记到 FoxPilot 的 SQLite 数据底座中。

**Architecture:** 这一版只覆盖“任务创建”一个最小闭环。实现上在现有 CLI 之上新增 `task create` 命令、项目解析层和任务仓储层，默认写入 `task`，可选写入 `task_target`，不扩展到任务执行与 `task_run`。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/cli/parse-args.ts`
  - 扩展 `task create` 参数解析
- `src/cli/main.ts`
  - 分发到 `task create`
- `src/commands/task/task-create-command.ts`
  - `task create` 命令编排
- `src/commands/task/task-create-types.ts`
  - `task create` 输入输出类型
- `src/project/resolve-project.ts`
  - 根据 `cwd` 或 `--path` 解析项目配置
- `src/db/task-store.ts`
  - `task` 与 `task_target` 写入
- `tests/cli/task-create-command.test.ts`
  - 任务创建 CLI 测试
- `tests/db/task-store.test.ts`
  - 任务仓储层测试

### Task 1: 任务仓储层

**Files:**
- Create: `src/db/task-store.ts`
- Test: `tests/db/task-store.test.ts`

- [ ] **Step 1: 写失败测试，覆盖 task 与 task_target 写入**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现 `createTaskStore` 与最小插入能力**
- [ ] **Step 4: 运行测试确认通过**

### Task 2: 项目解析层

**Files:**
- Create: `src/project/resolve-project.ts`
- Test: `tests/cli/task-create-command.test.ts`

- [ ] **Step 1: 写失败测试，覆盖按 `cwd` 或 `--path` 解析 `.foxpilot/project.json`**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现项目配置与仓库目标解析**
- [ ] **Step 4: 运行测试确认通过**

### Task 3: `task create` CLI 闭环

**Files:**
- Create: `src/commands/task/task-create-command.ts`
- Create: `src/commands/task/task-create-types.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`
- Modify: `tests/helpers/run-cli.ts`
- Test: `tests/cli/task-create-command.test.ts`

- [ ] **Step 1: 写失败的 CLI 集成测试**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现 `task create` 命令编排**
- [ ] **Step 4: 增加仓库目标、默认字段、错误路径测试**
- [ ] **Step 5: 运行全量测试与类型检查**

## 验证口径

1. `foxpilot task create --title "..."` 可用
2. `fp task create --title "..."` 可用
3. 可从当前项目目录解析 `.foxpilot/project.json`
4. 可通过 `--path` 指定项目根目录
5. 手动任务默认写入 `task.source_type = manual`
6. 手动任务默认写入 `task.status = todo`
7. 若传 `--repository`，会写入 `task_target`
8. 项目未初始化时返回清晰错误
9. `pnpm typecheck` 通过
10. `pnpm test` 通过
