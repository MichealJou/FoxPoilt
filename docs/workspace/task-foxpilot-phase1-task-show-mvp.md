# 任务：FoxPilot 第一阶段任务详情 MVP

## 目标

在 `task create`、`task list`、`task update-status` 已可用的前提下，补上单任务详情查看：`task show`。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`
- `docs/workspace/task-foxpilot-phase1-task-create-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-list-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-status-mvp.md`

## 当前范围

- 提供 `foxpilot task show` 与 `fp task show`
- 展示单任务基础字段
- 展示任务目标范围
- 限定在当前 managed project 内查询

## 暂不展开的内容

- `task_run` 历史查看
- 富文本详情
- JSON 输出
- 跨项目查询

## 进度

- [x] 已确定下一步为任务详情 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
