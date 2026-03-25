# FoxPilot Task Transition Guard MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已确认 `task update-status` 需要最小合法流转约束
- 已采用保守流转图，不引入配置化状态机
- 已完成非法流转拦截与验证
- 最新验证结果：
  - `pnpm vitest tests/cli/task-update-status-command.test.ts` 通过
  - `pnpm typecheck` 通过
  - `pnpm test` 通过

**Goal:** 构建第一版任务状态流转约束，让 `task update-status` 只接受明确允许的状态变化。

**Architecture:** 这一版把流转约束直接收敛在 `task update-status` 命令层，通过“当前状态 + 目标状态”判断是否合法；校验通过后才允许更新 `task` 和 `task_run`。这样可以在不新增配置系统的前提下，先挡住明显错误的状态跳转。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/commands/task/task-update-status-command.ts`
  - 增加合法流转矩阵和非法流转错误输出
- `src/i18n/messages.ts`
  - 增加非法流转的多语言文案
- `tests/cli/task-update-status-command.test.ts`
  - 覆盖合法与非法流转
- `README.zh-CN.md`
  - 补充状态流转说明
- `README.en.md`
  - 补充状态流转说明
- `README.ja.md`
  - 补充状态流转说明

## Task 1: 写状态流转失败测试

**Files:**
- Modify: `tests/cli/task-update-status-command.test.ts`

- [x] **Step 1: 写失败测试，覆盖 `todo -> done` 拒绝、`done -> analyzing` 拒绝、`blocked -> analyzing` 允许**
- [x] **Step 2: 运行 `pnpm vitest tests/cli/task-update-status-command.test.ts` 确认失败**

## Task 2: 实现最小状态流转约束

**Files:**
- Modify: `src/commands/task/task-update-status-command.ts`
- Modify: `src/i18n/messages.ts`

- [x] **Step 1: 实现允许流转矩阵与非法流转错误**
- [x] **Step 2: 只在合法流转时写入 `task` 与 `task_run`**
- [x] **Step 3: 再次运行 `pnpm vitest tests/cli/task-update-status-command.test.ts` 确认通过**

## Task 3: 文档与验证

**Files:**
- Modify: `README.zh-CN.md`
- Modify: `README.en.md`
- Modify: `README.ja.md`
- Modify: `docs/workspace/task-foxpilot-phase1-task-transition-guard-mvp.md`

- [x] **Step 1: 更新 README 的状态流转说明**
- [x] **Step 2: 更新任务进度，标记已开始实现**
- [x] **Step 3: 运行 `pnpm typecheck`**
- [x] **Step 4: 运行 `pnpm test`**
- [x] **Step 5: `git add`、`git commit`、`git push origin main`**
