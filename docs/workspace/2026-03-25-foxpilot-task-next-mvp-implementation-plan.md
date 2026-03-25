# FoxPilot Task Next MVP Implementation Plan

## 当前执行状态

- 已确认采用独立命令入口，而不是把“下一条任务选择”塞进 `task list`
- 已完成实现与验证

**Goal:** 构建第一版 `foxpilot task next` / `fp task next`，让当前项目可以直接得到一条最值得先推进的任务。

**Architecture:** 这一版通过仓储层统一完成候选筛选和排序。命令层负责项目解析、错误映射和终端输出；仓储层负责排除不可推进状态，并按状态阶段、优先级、更新时间三层规则返回单条结果。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`better-sqlite3`

## 文件结构

- `src/cli/main.ts`
  - 分发到 `task next`
- `src/commands/task/task-next-command.ts`
  - 下一条任务命令编排
- `src/commands/task/task-next-types.ts`
  - 下一条任务命令类型
- `src/db/task-store.ts`
  - 增加下一条任务候选查询能力
- `src/i18n/messages.ts`
  - 增加下一条任务命令文案
- `tests/cli/task-next-command.test.ts`
  - 命令测试
- `tests/db/task-store.test.ts`
  - 排序与过滤规则测试

## 执行结果

- [x] 写失败测试，覆盖帮助输出、候选排序、来源过滤、执行器过滤、空结果、项目未初始化、数据库失败
- [x] 运行定向测试确认失败
- [x] 实现仓储查询能力与命令编排
- [x] 运行定向测试确认通过
- [x] 运行 `pnpm typecheck`
- [x] 运行 `pnpm test`
