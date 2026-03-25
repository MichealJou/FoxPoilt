# FoxPilot Task Run MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成 `task_run` MVP 的范围界定
- 已明确人工状态推进到运行历史的第一版映射规则
- 已完成仓储层、状态更新联动和详情展示实现
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过

**Goal:** 构建第一版 `task_run` 运行历史能力，让 `task update-status` 在关键状态切换时写入历史，并让 `task show` 能展示运行历史摘要。

**Architecture:** 这一版只覆盖手动状态推进产生的最小历史记录。实现上在现有 `task-store` 上增加 `task_run` 的行模型、查询与更新能力，并在 `task update-status` 中根据目标状态映射到对应的 run 写入或收口动作，最后由 `task show` 增加历史区块输出。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/db/task-store.ts`
  - 增加 `task_run` 行模型、运行历史查询与状态收口能力
- `src/commands/task/task-update-status-command.ts`
  - 把目标状态映射到历史记录写入逻辑
- `src/commands/task/task-show-command.ts`
  - 在详情输出中追加运行历史区块
- `tests/db/task-store.test.ts`
  - 覆盖运行历史写入、关闭与查询
- `tests/cli/task-update-status-command.test.ts`
  - 覆盖状态变更联动历史写入
- `tests/cli/task-show-command.test.ts`
  - 覆盖详情页历史区块输出

## 状态映射约定

为避免命令层随手拼装历史，这一版先把映射规则固定为：

1. `analyzing`
   - 新建 `analysis / running`
2. `awaiting_plan_confirm`
   - 关闭最近一条未结束的 `analysis / running`
   - 结束状态为 `success`
3. `executing`
   - 新建 `execution / running`
4. `awaiting_result_confirm`
   - 关闭最近一条未结束的 `execution / running`
   - 新建 `verification / running`
5. `done`
   - 关闭最近一条未结束的 `verification / running`
   - 结束状态为 `success`
6. `blocked`
   - 关闭最近一条未结束的运行记录
   - 结束状态为 `failed`
7. `cancelled`
   - 关闭最近一条未结束的运行记录
   - 结束状态为 `cancelled`

## Task 1: 扩展 `task-store` 的运行历史能力

**Files:**
- Modify: `src/db/task-store.ts`
- Modify: `tests/db/task-store.test.ts`

- [x] **Step 1: 写失败测试，覆盖 `task_run` 插入、结束和按时间倒序查询**
- [x] **Step 2: 运行 `pnpm vitest tests/db/task-store.test.ts` 确认失败**
- [x] **Step 3: 在 `task-store` 中增加 `TaskRunRow`、运行开始、运行结束、最近运行查询接口**
- [x] **Step 4: 再次运行 `pnpm vitest tests/db/task-store.test.ts` 确认通过**

## Task 2: 为 `task update-status` 接入历史记录映射

**Files:**
- Modify: `src/commands/task/task-update-status-command.ts`
- Modify: `tests/cli/task-update-status-command.test.ts`

- [x] **Step 1: 写失败测试，覆盖 `analyzing`、`awaiting_plan_confirm`、`executing`、`blocked` 等关键状态联动**
- [x] **Step 2: 运行 `pnpm vitest tests/cli/task-update-status-command.test.ts` 确认失败**
- [x] **Step 3: 按映射规则在状态更新命令中调用 `task-store` 的运行历史接口**
- [x] **Step 4: 再次运行 `pnpm vitest tests/cli/task-update-status-command.test.ts` 确认通过**

## Task 3: 在 `task show` 中展示运行历史摘要

**Files:**
- Modify: `src/commands/task/task-show-command.ts`
- Modify: `tests/cli/task-show-command.test.ts`

- [x] **Step 1: 写失败测试，覆盖无历史和有历史两种详情输出**
- [x] **Step 2: 运行 `pnpm vitest tests/cli/task-show-command.test.ts` 确认失败**
- [x] **Step 3: 为 `task show` 增加历史区块输出，显示 run_type、executor、status、started_at、ended_at**
- [x] **Step 4: 再次运行 `pnpm vitest tests/cli/task-show-command.test.ts` 确认通过**

## Task 4: 全量验证与提交

**Files:**
- Modify: `docs/workspace/task-foxpilot-phase1-task-run-mvp.md`

- [x] **Step 1: 更新任务进度，标记已开始实现**
- [x] **Step 2: 运行 `pnpm typecheck`**
- [x] **Step 3: 运行 `pnpm test`**
- [x] **Step 4: `git add`、`git commit`、`git push origin main`**
