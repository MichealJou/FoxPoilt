# 任务：FoxPilot 第一阶段外部任务号直连 MVP

## 目标

在 `task import-beads` 已经能把外部任务导入本地的前提下，补上“直接通过外部任务号操作单任务”的闭环，避免用户必须先查内部 `task:<uuid>`。

## 承接来源

- `docs/workspace/task-foxpilot-phase1-task-import-beads-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-show-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-history-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-edit-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-status-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-executor-mvp.md`
- `docs/workspace/task-foxpilot-phase1-task-priority-mvp.md`

## 当前范围

- 为单任务命令统一支持 `--external-id`
- 当前默认外部来源为 `beads`
- 覆盖 `task show`、`task history`、`task edit`
- 覆盖 `task update-status`、`task update-executor`、`task update-priority`
- README 和安装验证同步体现外部任务号入口

## 暂不展开的内容

- 多外部来源并存时的复杂冲突消解
- 批量外部任务号更新
- 外部来源反向写回
- 自动补全或模糊匹配外部任务号

## 进度

- [x] 已确定下一步为外部任务号直连 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
