# 任务：FoxPilot 第一阶段下一条任务 MVP

## 目标

在任务创建、列表、详情、历史、状态流转和执行器切换都已具备的前提下，补上一条“帮人选下一条任务”的最小命令入口。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`

## 当前范围

- 提供 `foxpilot task next` 与 `fp task next`
- 只返回当前项目内 1 条最值得先推进的任务
- 支持按任务来源、当前责任执行器过滤
- 明确排除 `blocked`、`done`、`cancelled`
- 采用固定排序规则：
  - 活跃状态优先于普通待办
  - 高优先级优先于低优先级
  - 最近更新时间用于打破并列

## 设计约束

- 不自动修改任务状态
- 不自动切换执行器
- 不联动 `task_run`
- 不引入可配置排序策略

## 暂不展开的内容

- 不支持按仓库、任务类型做更细粒度筛选
- 不支持交互式“领取下一条任务”
- 不支持根据历史耗时或运行结果做智能排序
- 不支持跨项目挑选下一条任务

## 进度

- [x] 已确定采用独立命令入口
- [x] 已完成实现与验证
