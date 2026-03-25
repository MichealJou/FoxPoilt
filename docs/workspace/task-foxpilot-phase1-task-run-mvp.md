# 任务：FoxPilot 第一阶段任务运行历史 MVP

## 目标

在 `task create`、`task show`、`task update-status` 已可用的前提下，补上最小运行历史能力，让任务不再只有“当前态”，还能保留关键流转过程。

## 承接来源

- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`
- `docs/specs/sql/foxpilot-phase1-init.sql`
- `docs/workspace/task-foxpilot-phase1-task-show-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-status-mvp.md`

## 当前范围

- 为 `task_run` 明确第一版状态映射规则
- 在仓储层补齐 `task_run` 的写入与查询能力
- 让 `task update-status` 在关键状态切换时同步维护运行历史
- 让 `task show` 能展示任务的历史记录摘要

## 第一版映射规则

本 MVP 先采用保守映射，只覆盖人工状态推进下最容易解释的历史语义：

- 进入 `analyzing`
  - 新建一条 `analysis / running`
- 进入 `awaiting_plan_confirm`
  - 关闭最近一条未结束的 `analysis / running`
  - 将其更新为 `analysis / success`
- 进入 `executing`
  - 新建一条 `execution / running`
- 进入 `awaiting_result_confirm`
  - 关闭最近一条未结束的 `execution / running`
  - 新建一条 `verification / running`
- 进入 `done`
  - 关闭最近一条未结束的 `verification / running`
  - 将其更新为 `verification / success`
- 进入 `blocked`
  - 尝试关闭最近一条未结束的运行记录
  - 将其更新为 `failed`
- 进入 `cancelled`
  - 尝试关闭最近一条未结束的运行记录
  - 将其更新为 `cancelled`

## 暂不展开的内容

- 自动状态机合法性校验
- 多条并发运行记录
- 运行产物、日志全文、附件路径
- `Beads` / 外部执行器回填运行历史
- 单独的 `task history` 命令

## 进度

- [x] 已确定下一步为任务运行历史 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
