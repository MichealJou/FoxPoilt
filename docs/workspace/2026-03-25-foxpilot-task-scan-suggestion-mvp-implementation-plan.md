# FoxPilot Task Scan Suggestion MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已确认采用独立命令入口，而不是在 `init` 中隐式建任务
- 已采用“按仓库生成、按未完成任务去重”的保守策略
- 已完成实现与验证

**Goal:** 构建第一版 `foxpilot task suggest-scan` / `fp task suggest-scan`，让当前项目可以根据已登记仓库生成扫描建议任务。

**Architecture:** 这一版直接复用当前项目配置中的仓库列表，不重新扫描文件系统。命令层先解析当前受管项目，再通过任务仓储层查询已有未完成扫描建议，最后只为缺失项创建 `scan_suggestion` 任务和对应仓库目标。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/cli/main.ts`
  - 分发到 `task suggest-scan`
- `src/commands/task/task-suggest-scan-command.ts`
  - 扫描建议命令编排
- `src/commands/task/task-suggest-scan-types.ts`
  - 扫描建议命令输入输出类型
- `src/db/task-store.ts`
  - 增加读取未完成扫描建议任务目标的查询能力
- `src/i18n/messages.ts`
  - 增加扫描建议命令文案
- `tests/cli/task-suggest-scan-command.test.ts`
  - 扫描建议命令测试
- `tests/db/task-store.test.ts`
  - 去重查询测试
- `README.zh-CN.md`
  - 补充命令说明
- `README.en.md`
  - 补充命令说明
- `README.ja.md`
  - 补充命令说明

## Task 1: 写失败测试

**Files:**
- Create: `tests/cli/task-suggest-scan-command.test.ts`
- Modify: `tests/db/task-store.test.ts`

- [x] **Step 1: 写失败测试，覆盖帮助输出、首次生成、重复执行跳过、项目未初始化**
- [x] **Step 2: 运行 `pnpm vitest tests/cli/task-suggest-scan-command.test.ts tests/db/task-store.test.ts` 确认失败**

## Task 2: 实现 `task suggest-scan` 命令

**Files:**
- Create: `src/commands/task/task-suggest-scan-command.ts`
- Create: `src/commands/task/task-suggest-scan-types.ts`
- Modify: `src/cli/main.ts`
- Modify: `src/db/task-store.ts`
- Modify: `src/i18n/messages.ts`

- [x] **Step 1: 实现未完成扫描建议去重查询**
- [x] **Step 2: 实现命令编排与任务创建**
- [x] **Step 3: 再次运行 `pnpm vitest tests/cli/task-suggest-scan-command.test.ts tests/db/task-store.test.ts` 确认通过**

## Task 3: 文档与验证

**Files:**
- Modify: `README.zh-CN.md`
- Modify: `README.en.md`
- Modify: `README.ja.md`
- Modify: `docs/workspace/task-foxpilot-phase1-task-scan-suggestion-mvp.md`

- [x] **Step 1: 更新 README 的当前能力和示例**
- [x] **Step 2: 更新任务进度，标记已开始实现**
- [x] **Step 3: 运行 `pnpm typecheck`**
- [x] **Step 4: 运行 `pnpm test`**
- [ ] **Step 5: `git add`、`git commit`、`git push origin main`**
