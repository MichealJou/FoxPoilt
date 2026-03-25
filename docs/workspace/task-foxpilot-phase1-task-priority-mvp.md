# 任务：FoxPilot 第一阶段任务优先级 MVP

## 目标

在任务创建、列表、下一条任务选择和执行器切换已可用的前提下，补上一条“任务优先级调整”的最小命令入口。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`

## 当前范围

- 提供 `foxpilot task update-priority` 与 `fp task update-priority`
- 支持在 `P0`、`P1`、`P2`、`P3` 之间切换任务当前优先级
- 同优先级更新保持无副作用成功
- 输出更新前后的优先级

## 设计约束

- 只更新 `task.priority`
- 不联动 `task_run`
- 不自动触发 `task next`
- 不引入批量优先级调整能力

## 暂不展开的内容

- 基于规则的自动优先级计算
- 与执行器、状态联动的优先级策略
- 批量调高或调低优先级
- 基于外部工单系统同步优先级

## 进度

- [x] 已确定采用独立命令入口
- [x] 已完成实现与验证
