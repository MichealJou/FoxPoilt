# 任务：FoxPilot 第一阶段任务状态流转约束 MVP

## 目标

在 `task update-status` 已可用、`task_run` 已开始记录历史的前提下，为状态推进补上最小合法流转约束，避免明显错误的跳转直接写入数据库。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/workspace/task-foxpilot-phase1-task-status-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-run-mvp.md`

## 当前范围

- 为 `task update-status` 增加最小合法流转校验
- 拒绝从 `todo` 直接跳到 `done` 这类明显错误的变更
- 保持 `blocked` / `cancelled` 的人工兜底语义
- 非法流转时不修改 `task` 和 `task_run`

## 第一版流转规则

- `todo -> analyzing | blocked | cancelled`
- `analyzing -> awaiting_plan_confirm | blocked | cancelled`
- `awaiting_plan_confirm -> executing | cancelled`
- `executing -> awaiting_result_confirm | blocked | cancelled`
- `awaiting_result_confirm -> done | blocked | cancelled`
- `blocked -> analyzing | cancelled`
- `done`、`cancelled` 为终态，不再允许继续流转

## 暂不展开的内容

- 配置化状态机
- 不同任务类型的差异流转规则
- 带原因码的拒绝策略
- 自动重试和回滚补偿

## 进度

- [x] 已确定下一步为任务状态流转约束 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
