# FoxPilot Task History MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已确认 `task show` 与 `task history` 需要分层
- 已决定新增独立的历史查看命令，而不是继续扩展详情命令
- 已完成命令实现与验证
- 最新验证结果：
  - `pnpm vitest tests/cli/task-history-command.test.ts` 通过
  - `pnpm typecheck` 通过
  - `pnpm test` 通过

**Goal:** 构建第一版 `foxpilot task history` / `fp task history`，让用户可以在当前项目范围内查看单任务的完整运行历史。

**Architecture:** 这一版复用现有 `task_store.listTaskRuns` 能力，不新增新的持久化结构。CLI 层增加 `task history` 路由和独立输出格式，继续沿用当前 managed project 解析、多语言帮助输出和项目隔离逻辑。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/cli/parse-args.ts`
  - 扩展 `task history` 参数解析
- `src/cli/main.ts`
  - 分发到 `task history`
- `src/commands/task/task-history-command.ts`
  - 历史查看命令编排
- `src/commands/task/task-history-types.ts`
  - 历史查看命令输入输出类型
- `src/i18n/messages.ts`
  - 增加 `task history` 的多语言文案
- `tests/cli/task-history-command.test.ts`
  - 历史查看命令测试
- `README.zh-CN.md`
  - 补充命令示例
- `README.en.md`
  - 补充命令示例
- `README.ja.md`
  - 补充命令示例

## Task 1: 新增 `task history` CLI 测试

**Files:**
- Create: `tests/cli/task-history-command.test.ts`

- [x] **Step 1: 写失败测试，覆盖帮助输出、空历史、存在历史、项目未初始化、跨项目隔离**
- [x] **Step 2: 运行 `pnpm vitest tests/cli/task-history-command.test.ts` 确认失败**

## Task 2: 实现 `task history` 命令闭环

**Files:**
- Create: `src/commands/task/task-history-command.ts`
- Create: `src/commands/task/task-history-types.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`
- Modify: `src/i18n/messages.ts`

- [x] **Step 1: 实现 `task history` 参数类型与命令编排**
- [x] **Step 2: 接入主路由和帮助输出**
- [x] **Step 3: 再次运行 `pnpm vitest tests/cli/task-history-command.test.ts` 确认通过**

## Task 3: 文档与全量验证

**Files:**
- Modify: `README.zh-CN.md`
- Modify: `README.en.md`
- Modify: `README.ja.md`
- Modify: `docs/workspace/task-foxpilot-phase1-task-history-mvp.md`

- [x] **Step 1: 更新 README 的当前能力和命令示例**
- [x] **Step 2: 更新任务进度，标记已开始实现**
- [x] **Step 3: 运行 `pnpm typecheck`**
- [x] **Step 4: 运行 `pnpm test`**
- [x] **Step 5: `git add`、`git commit`、`git push origin main`**
