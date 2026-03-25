# FoxPilot Task Status MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成 `task update-status` MVP 的实现与验证
- 已支持 `foxpilot task update-status` 与 `fp task update-status`
- 已支持项目内任务状态更新、项目隔离和 SQLite 错误映射
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
- 提交步骤未执行，因为当前工作区不是 git 仓库

**Goal:** 构建第一版 `foxpilot task update-status` / `fp task update-status`，让用户可以手动推进任务当前状态。

**Architecture:** 这一版只覆盖项目内单任务状态更新。实现上在现有 `task` 数据底座之上扩展仓储层查询与更新能力，并在 CLI 层通过当前 managed project 限定更新范围，不扩展到 `task_run` 历史和自动流转规则。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/cli/parse-args.ts`
  - 扩展 `task update-status` 参数解析
- `src/cli/main.ts`
  - 分发到 `task update-status`
- `src/commands/task/task-update-status-command.ts`
  - 状态更新命令编排
- `src/commands/task/task-update-status-types.ts`
  - 状态更新输入输出类型
- `src/db/task-store.ts`
  - 增加按项目读取单任务与状态更新能力
- `tests/db/task-store.test.ts`
  - 任务状态更新测试
- `tests/cli/task-update-status-command.test.ts`
  - 状态更新 CLI 测试

### Task 1: 状态更新仓储层

**Files:**
- Modify: `src/db/task-store.ts`
- Modify: `tests/db/task-store.test.ts`

- [ ] **Step 1: 写失败测试，覆盖按项目查任务与更新状态**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现单任务查询和状态更新**
- [ ] **Step 4: 运行测试确认通过**

### Task 2: `task update-status` CLI 闭环

**Files:**
- Create: `src/commands/task/task-update-status-command.ts`
- Create: `src/commands/task/task-update-status-types.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`
- Test: `tests/cli/task-update-status-command.test.ts`

- [ ] **Step 1: 写失败的 CLI 测试**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现 `task update-status` 编排**
- [ ] **Step 4: 增加帮助信息、项目隔离、未命中任务测试**
- [ ] **Step 5: 运行全量测试与类型检查**
