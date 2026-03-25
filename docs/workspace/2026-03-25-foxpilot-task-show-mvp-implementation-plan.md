# FoxPilot Task Show MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成 `task show` MVP 的实现与验证
- 已支持 `foxpilot task show` 与 `fp task show`
- 已支持单任务基础字段与 `task_target` 目标展示
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
- 提交步骤未执行，因为当前工作区不是 git 仓库

**Goal:** 构建第一版 `foxpilot task show` / `fp task show`，让用户可以查看单任务详情和目标范围。

**Architecture:** 这一版只覆盖项目内单任务详情展示。实现上在现有 `task-store` 上扩展单任务详情查询和 `task_target` 联查，并在 CLI 层复用当前 managed project 解析逻辑，不扩展到 `task_run` 历史与 JSON 输出。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/cli/parse-args.ts`
  - 扩展 `task show` 参数解析
- `src/cli/main.ts`
  - 分发到 `task show`
- `src/commands/task/task-show-command.ts`
  - 任务详情命令编排
- `src/commands/task/task-show-types.ts`
  - 任务详情输入输出类型
- `src/db/task-store.ts`
  - 增加任务详情查询能力
- `tests/db/task-store.test.ts`
  - 任务详情仓储层测试
- `tests/cli/task-show-command.test.ts`
  - 任务详情 CLI 测试

### Task 1: 任务详情仓储层

**Files:**
- Modify: `src/db/task-store.ts`
- Modify: `tests/db/task-store.test.ts`

- [ ] **Step 1: 写失败测试，覆盖单任务详情与 target 联查**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现最小详情查询能力**
- [ ] **Step 4: 运行测试确认通过**

### Task 2: `task show` CLI 闭环

**Files:**
- Create: `src/commands/task/task-show-command.ts`
- Create: `src/commands/task/task-show-types.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`
- Test: `tests/cli/task-show-command.test.ts`

- [ ] **Step 1: 写失败的 CLI 测试**
- [ ] **Step 2: 运行测试确认失败**
- [ ] **Step 3: 实现 `task show` 编排与文本输出**
- [ ] **Step 4: 增加帮助信息、项目隔离、未命中任务测试**
- [ ] **Step 5: 运行全量测试与类型检查**
