# FoxPilot Task External Reference MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 当前执行状态

- 已完成“外部任务号直连”能力实现与验证
- 单任务命令已支持 `--id` 与 `--external-id` 二选一
- 当前默认外部来源为 `beads`
- README 与安装验证已同步更新
- 最新验证结果：
  - `pnpm typecheck` 通过
  - `pnpm test` 通过
  - `pnpm build` 通过
  - `pnpm verify:install` 通过

**Goal:** 让导入的外部任务能够直接通过稳定外部任务号被查看和更新，不再要求用户先查询内部 `task:<uuid>`。

**Architecture:** 在命令层新增统一任务身份解析器，优先兼容原有内部 `id` 路径；当未提供 `id` 时，再用 `externalSource + externalId` 解析为内部任务主键。各单任务命令只接入这一层，不改动底层表结构。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

---

## 文件结构

- `src/commands/task/task-reference.ts`
  - 单任务命令共用的任务身份解析器
- `src/cli/parse-args.ts`
  - 增加 `--external-id` / `--external-source` 参数解析
- `src/cli/main.ts`
  - 把外部任务号参数透传给单任务命令
- `src/commands/task/task-show-command.ts`
  - 接入外部任务号直连
- `src/commands/task/task-history-command.ts`
  - 接入外部任务号直连
- `src/commands/task/task-edit-command.ts`
  - 接入外部任务号直连
- `src/commands/task/task-update-status-command.ts`
  - 接入外部任务号直连
- `src/commands/task/task-update-executor-command.ts`
  - 接入外部任务号直连
- `src/commands/task/task-update-priority-command.ts`
  - 接入外部任务号直连
- `tests/helpers/imported-beads-task.ts`
  - 导入任务测试夹具
- `tests/cli/*.test.ts`
  - 外部任务号直连测试
- `scripts/verify-install.sh`
  - 安装后外部任务号读取验证

### Task 1: 统一任务身份解析层

**Files:**
- Create: `src/commands/task/task-reference.ts`
- Modify: `src/cli/parse-args.ts`
- Modify: `src/cli/main.ts`

- [ ] **Step 1: 定义单任务命令共享的任务身份模型**
- [ ] **Step 2: 扩展 CLI 参数解析与主入口透传**
- [ ] **Step 3: 实现统一的外部任务号解析器**

### Task 2: 单任务命令接入

**Files:**
- Modify: `src/commands/task/task-show-command.ts`
- Modify: `src/commands/task/task-history-command.ts`
- Modify: `src/commands/task/task-edit-command.ts`
- Modify: `src/commands/task/task-update-status-command.ts`
- Modify: `src/commands/task/task-update-executor-command.ts`
- Modify: `src/commands/task/task-update-priority-command.ts`

- [ ] **Step 1: 先补失败测试，覆盖 6 条外部任务号路径**
- [ ] **Step 2: 让命令层改用统一任务身份解析器**
- [ ] **Step 3: 同步帮助页与错误提示**

### Task 3: 文档与安装验证

**Files:**
- Modify: `README.zh-CN.md`
- Modify: `README.en.md`
- Modify: `README.ja.md`
- Modify: `scripts/verify-install.sh`

- [ ] **Step 1: 更新三语 README 示例**
- [ ] **Step 2: 把外部任务号入口纳入安装验证**
- [ ] **Step 3: 运行类型检查、全量测试、构建与安装验证**
