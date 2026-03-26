# FoxPilot Task Import Beads Close Missing MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成 `task import-beads --close-missing` 的实现与验证
- 默认导入行为仍保持“创建 / 更新 / 跳过”
- 显式传入 `--close-missing` 时，会把当前快照中已缺失的未完成 `beads_sync` 任务标记为 `cancelled`
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
  - `pnpm build` 通过
  - `pnpm verify:install` 通过

**Goal:** 为本地 Beads 快照导入补齐最小同步收口能力，避免外部任务已经消失但本地同步任务长期残留。

**Architecture:** 保持导入命令默认安全，新增显式开关 `--close-missing`。实现上先收集原始快照里声明过的 `externalTaskId`，再读取当前项目内未完成的 `beads_sync` 任务引用，对真正未出现在快照中的任务做当前态收口。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/cli/parse-args.ts`
  - 增加 `--close-missing` 解析
- `src/cli/main.ts`
  - 透传收口开关
- `src/commands/task/task-import-beads-command.ts`
  - 导入后执行缺失任务收口
- `src/commands/task/task-import-beads-types.ts`
  - 增加参数定义
- `src/sync/beads-import-service.ts`
  - 提取原始快照里声明过的外部任务号
- `src/db/task-store.ts`
  - 查询当前项目内未完成的外部同步任务
- `tests/cli/task-import-beads-command.test.ts`
  - CLI 行为测试
- `tests/sync/beads-import-service.test.ts`
  - 安全收口辅助逻辑测试

### Task 1: 参数与仓储支撑

**Files:**
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`
- Modify: `src/commands/task/task-import-beads-types.ts`
- Modify: `src/db/task-store.ts`

- [ ] **Step 1: 定义收口开关参数**
- [ ] **Step 2: 增加未完成外部同步任务引用查询**

### Task 2: 导入收口逻辑

**Files:**
- Modify: `src/commands/task/task-import-beads-command.ts`
- Modify: `src/sync/beads-import-service.ts`

- [ ] **Step 1: 先补失败测试**
- [ ] **Step 2: 实现 declared external ids 保护逻辑**
- [ ] **Step 3: 实现 `--close-missing` 收口流程**

### Task 3: 文档与安装验证

**Files:**
- Modify: `README.zh-CN.md`
- Modify: `README.en.md`
- Modify: `README.ja.md`
- Modify: `scripts/verify-install.sh`

- [ ] **Step 1: 更新三语 README 示例**
- [ ] **Step 2: 把安装后收口流程纳入验证**
- [ ] **Step 3: 运行全量验证**
