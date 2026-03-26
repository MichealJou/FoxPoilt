# FoxPilot Task Import Beads Dry Run MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成 `task import-beads --dry-run` 的实现与验证
- 预演与真实导入复用同一套创建 / 更新 / 跳过 / 收口决策
- `--dry-run` 与 `--close-missing` 可以组合使用
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
  - `pnpm build` 通过
  - `pnpm verify:install` 通过

**Goal:** 让用户在真正写库前，先预览 Beads 快照导入会带来的创建、更新、跳过与收口结果。

**Architecture:** 不额外引入新命令，而是在 `task import-beads` 上增加 `--dry-run`。实现上保持真实导入路径不变，只在落库前短路为“只统计不写入”，确保预演结果和真实执行使用同一套决策逻辑。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/cli/parse-args.ts`
  - 增加 `--dry-run`
- `src/cli/main.ts`
  - 透传预演开关
- `src/commands/task/task-import-beads-command.ts`
  - 复用导入逻辑并在写库前短路
- `src/commands/task/task-import-beads-types.ts`
  - 增加参数定义
- `tests/cli/task-import-beads-command.test.ts`
  - 预演行为测试
- `README.*`
  - 使用示例
- `scripts/verify-install.sh`
  - 安装后预演验证

### Task 1: 参数与命令协议

**Files:**
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`
- Modify: `src/commands/task/task-import-beads-types.ts`

- [ ] **Step 1: 定义 `--dry-run` 参数**
- [ ] **Step 2: 透传到导入命令**

### Task 2: 预演逻辑

**Files:**
- Modify: `src/commands/task/task-import-beads-command.ts`
- Modify: `tests/cli/task-import-beads-command.test.ts`

- [ ] **Step 1: 先补失败测试**
- [ ] **Step 2: 让预演复用真实导入决策路径**
- [ ] **Step 3: 确保预演不产生持久化副作用**

### Task 3: 文档与安装验证

**Files:**
- Modify: `README.zh-CN.md`
- Modify: `README.en.md`
- Modify: `README.ja.md`
- Modify: `scripts/verify-install.sh`

- [ ] **Step 1: 更新三语 README 示例**
- [ ] **Step 2: 把预演流程纳入安装验证**
- [ ] **Step 3: 运行全量验证**
