# 任务：FoxPilot 第一阶段 Beads 缺失任务收口 MVP

## 目标

在 `task import-beads` 已经支持创建、更新、跳过的前提下，补上“快照中已缺失外部任务的显式收口”能力，避免本地同步任务长期残留。

## 承接来源

- `docs/workspace/task-foxpilot-phase1-task-import-beads-mvp.md`
- `docs/workspace/task-foxpilot-phase1-collaboration-orchestration-mvp.md`
- `docs/workspace/2026-03-25-foxpilot-collaboration-orchestration-mvp-design.md`

## 当前范围

- 为 `task import-beads` 增加 `--close-missing`
- 只收口当前项目内未完成的 `beads_sync` 任务
- 收口策略为把缺失任务状态标记为 `cancelled`
- 已完成和已取消任务不重复收口
- README 和安装验证同步体现该能力

## 设计约束

- 默认导入行为不变，不做隐式破坏性收口
- 不引入真实网络同步
- 不在同步入口里写 `task_run`
- 如果某条记录虽然被拒绝但仍声明了 `externalTaskId`，不把它误判为“缺失”

## 暂不展开的内容

- 缺失任务的软删除
- 缺失任务的自定义终态策略
- 基于时间窗口的延迟收口
- 多来源同步冲突收口

## 进度

- [x] 已确定下一步为缺失任务收口 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
