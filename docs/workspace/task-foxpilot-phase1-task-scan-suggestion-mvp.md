# 任务：FoxPilot 第一阶段扫描建议任务 MVP

## 目标

在项目初始化、任务创建、任务历史与状态流转约束已可用的前提下，补上一条“扫描结果转建议任务”的最小命令入口。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-init-design.md`
- `docs/workspace/task-foxpilot-phase1-task-create-mvp.md`

## 当前范围

- 提供 `foxpilot task suggest-scan` 与 `fp task suggest-scan`
- 基于当前项目登记的仓库列表生成 `scan_suggestion` 任务
- 每个仓库最多保留一条未完成的扫描建议任务
- 输出创建数与跳过数

## 任务生成规则

- 仅面向当前项目 `project.json` 中已登记的仓库
- 每个仓库生成一条仓库级目标任务
- 任务字段固定为：
  - `source_type = scan_suggestion`
  - `status = todo`
  - `priority = P2`
  - `task_type = init`
  - `execution_mode = manual`
  - `requires_plan_confirm = 1`
  - `current_executor = none`

## 暂不展开的内容

- 重新扫描文件系统生成差异建议
- 基于语言栈生成不同建议模板
- 项目级无仓库建议任务
- 自动关闭过期扫描建议
- JSON 输出和过滤参数

## 进度

- [x] 已确定下一步为扫描建议任务 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
