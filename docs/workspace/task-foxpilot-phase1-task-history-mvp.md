# 任务：FoxPilot 第一阶段任务历史查看 MVP

## 目标

在 `task_run` 已经开始落库、`task show` 已能展示历史摘要的前提下，补上一条独立的历史查看命令，让任务详情和历史查询分层清楚。

## 承接来源

- `docs/workspace/task-foxpilot-phase1-task-run-mvp.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`

## 当前范围

- 提供 `foxpilot task history` 与 `fp task history`
- 支持按当前项目上下文查看单任务运行历史
- 输出 `run_type`、`executor`、`status`、`started_at`、`ended_at`、`summary`
- 沿用当前多语言帮助与错误输出体系

## 暂不展开的内容

- 按 `run_type` 过滤
- 分页与限制条数
- JSON 输出
- 跨项目联合历史查询
- 运行产物、日志文件、附件路径

## 进度

- [x] 已确定下一步为任务历史查看 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
