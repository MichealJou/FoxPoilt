# 任务：FoxPilot 第一阶段任务编辑 MVP

## 目标

在任务创建、列表、下一条任务选择、优先级调整和执行器切换都已可用的前提下，补上一条“编辑任务元数据”的最小命令入口。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`

## 当前范围

- 提供 `foxpilot task edit` 与 `fp task edit`
- 支持编辑 `title`、`description`、`task_type`
- 支持通过 `--clear-description` 明确清空描述
- 至少要求传入一个可编辑字段
- 无变化更新保持无副作用成功

## 设计约束

- 只更新 `task` 当前态中的元数据字段
- 不联动 `task_run`
- 不联动状态、优先级或执行器
- 不支持批量编辑

## 暂不展开的内容

- 富文本描述
- 附件、标签、备注等扩展元数据
- 批量编辑和交互式编辑器
- 基于模板自动重写任务标题或描述

## 进度

- [x] 已确定采用独立命令入口
- [x] 已完成实现与验证
