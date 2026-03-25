# 任务：FoxPilot 第一阶段任务执行器 MVP

## 目标

在任务创建、查看、状态流转与扫描建议入口已可用的前提下，补上一条“当前责任执行器切换”的最小命令入口。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`

## 当前范围

- 提供 `foxpilot task update-executor` 与 `fp task update-executor`
- 支持在 `codex`、`beads`、`none` 之间切换任务当前责任执行器
- 同状态更新保持无副作用成功
- 输出更新前后的执行器

## 设计约束

- 只更新 `task.current_executor`
- 不联动 `task_run`
- 不引入执行器策略表
- 不自动根据状态流转切换执行器

## 暂不展开的内容

- 基于规则的自动执行器分配
- 执行器回填运行历史
- `Beads` 外部真实同步
- 按执行器批量过滤或批量更新

## 进度

- [x] 已确定采用独立命令入口
- [x] 已完成实现与验证
