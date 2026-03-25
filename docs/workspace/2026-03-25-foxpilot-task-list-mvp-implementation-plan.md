# FoxPilot Task List MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成 `task list` MVP 的实现与验证
- 已支持 `foxpilot task list` 与 `fp task list`
- 已支持按项目列出任务与按状态、来源、执行器过滤
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
- 提交步骤未执行，因为当前工作区不是 git 仓库

**Goal:** 构建第一版 `foxpilot task list` / `fp task list`，让用户可以按项目查看已登记任务。

**Architecture:** 这一版覆盖项目级任务当前态列表输出。实现上在现有 `task create` 基础上扩展 CLI 分发与任务仓储层查询能力，默认输出文本表格，并支持状态、来源、执行器这三类最小过滤条件，不扩展到分页、排序定制或看板视图。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/cli/parse-args.ts`
  - 扩展 `task list` 参数解析
- `src/cli/main.ts`
  - 分发到 `task list`
- `src/commands/task/task-list-command.ts`
  - `task list` 命令编排
- `src/commands/task/task-list-types.ts`
  - `task list` 类型定义
- `src/db/task-store.ts`
  - 增加按项目查询任务能力
- `tests/cli/task-list-command.test.ts`
  - 列表 CLI 测试
- `tests/db/task-store.test.ts`
  - 任务查询测试

### Task 1: 任务查询仓储层

**Files:**
- Modify: `src/db/task-store.ts`
- Modify: `tests/db/task-store.test.ts`

- [ ] **Step 1: 写失败测试，覆盖按项目列出任务与按状态过滤**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现最小查询能力**
- [ ] **Step 4: 运行测试确认通过**

### Task 2: `task list` CLI 闭环

**Files:**
- Create: `src/commands/task/task-list-command.ts`
- Create: `src/commands/task/task-list-types.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`
- Test: `tests/cli/task-list-command.test.ts`

- [ ] **Step 1: 写失败的 CLI 测试**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现 `task list` 编排与文本输出**
- [ ] **Step 4: 增加状态过滤与空列表测试**
- [ ] **Step 5: 运行全量测试与类型检查**
