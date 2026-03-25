# FoxPilot Task Edit MVP Implementation Plan

## 当前执行状态

- 已确认采用独立命令入口，而不是把标题、描述、任务类型修改分散到多个 `update-*` 命令
- 已完成实现与验证

**Goal:** 构建第一版 `foxpilot task edit` / `fp task edit`，让任务当前元数据可以显式修改。

**Architecture:** 这一版通过 `task edit` 统一承接标题、描述和任务类型的人工修改。命令层负责参数冲突校验、项目解析和错误映射，仓储层负责按项目范围更新 `task` 主表中的当前态元数据字段。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

## 文件结构

- `src/cli/main.ts`
  - 分发到 `task edit`
- `src/cli/parse-args.ts`
  - 解析 `--clear-description`
  - 把 `taskType` 默认值责任收回到具体命令，避免编辑命令误判
- `src/commands/task/task-edit-command.ts`
  - 任务元数据编辑命令编排
- `src/commands/task/task-edit-types.ts`
  - 任务元数据编辑命令类型
- `src/db/task-store.ts`
  - 增加任务元数据更新能力
- `src/i18n/messages.ts`
  - 增加任务编辑命令文案
- `tests/cli/task-edit-command.test.ts`
  - 命令测试
- `tests/db/task-store.test.ts`
  - 存储更新测试

## 执行结果

- [x] 写失败测试，覆盖多字段更新、清空描述、无变更参数报错、描述参数冲突、项目未初始化、跨项目隔离、数据库失败、无变化短路
- [x] 运行定向测试确认失败
- [x] 实现仓储更新能力与命令编排
- [x] 修正 `taskType` 默认值下沉位置，避免编辑命令把未传值误判为修改
- [x] 运行定向测试确认通过
- [x] 运行 `pnpm typecheck`
- [x] 运行 `pnpm test`
