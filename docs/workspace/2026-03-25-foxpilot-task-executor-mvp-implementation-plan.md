# FoxPilot Task Executor MVP Implementation Plan

## 当前执行状态

- 已确认采用独立命令入口，而不是把执行器修改混进 `task update-status`
- 已完成实现与验证

**Goal:** 构建第一版 `foxpilot task update-executor` / `fp task update-executor`，让任务当前责任执行器可以显式切换。

**Architecture:** 这一版直接更新 `task.current_executor` 当前态字段，不联动 `task_run`。命令层负责项目解析、参数校验和错误映射，仓储层只负责按项目范围更新持久化字段。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

## 文件结构

- `src/cli/main.ts`
  - 分发到 `task update-executor`
- `src/cli/parse-args.ts`
  - 解析 `--executor`
- `src/commands/task/task-update-executor-command.ts`
  - 执行器更新命令编排
- `src/commands/task/task-update-executor-types.ts`
  - 执行器更新命令类型
- `src/db/task-store.ts`
  - 增加执行器更新能力
- `src/i18n/messages.ts`
  - 增加执行器更新命令文案
- `tests/cli/task-update-executor-command.test.ts`
  - 命令测试
- `tests/db/task-store.test.ts`
  - 存储更新测试

## 执行结果

- [x] 写失败测试，覆盖帮助输出、更新成功、非法执行器、项目未初始化、跨项目隔离、数据库失败、无变化短路
- [x] 运行定向测试确认失败
- [x] 实现仓储更新能力与命令编排
- [x] 运行定向测试确认通过
- [x] 运行 `pnpm typecheck`
- [x] 运行 `pnpm test`
