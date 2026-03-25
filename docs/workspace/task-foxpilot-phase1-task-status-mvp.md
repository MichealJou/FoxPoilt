# 任务：FoxPilot 第一阶段任务状态变更 MVP

## 目标

在 `task create` 与 `task list` 已可用的前提下，补上最小状态推进能力：手动更新任务状态。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`
- `docs/workspace/task-foxpilot-phase1-task-create-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-list-mvp.md`

## 当前范围

- 提供 `foxpilot task update-status` 与 `fp task update-status`
- 允许按当前项目上下文更新任务状态
- 更新 `task.status` 与 `task.updated_at`
- 返回清晰成功/失败输出

## 暂不展开的内容

- `task_run` 历史写入
- 自动状态流转校验
- 批量状态更新
- 当前执行器自动切换

## 进度

- [x] 已确定下一步为任务状态变更 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
