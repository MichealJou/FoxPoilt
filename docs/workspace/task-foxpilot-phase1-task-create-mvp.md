# 任务：FoxPilot 第一阶段手动任务登记 MVP

## 目标

在 `FoxPilot init MVP` 已完成的前提下，补上第一条真正可用的任务入口：手动登记任务。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`
- `docs/workspace/2026-03-25-foxpilot-init-mvp-implementation-plan.md`

## 当前范围

- 提供 `foxpilot task create` 与 `fp task create`
- 将手动任务写入 `task` 表
- 可选将仓库目标写入 `task_target`
- 提供最小成功/失败输出与错误码

## 暂不展开的内容

- 任务执行
- 任务运行记录写入
- 任务列表视图
- Beads 同步
- 扫描建议任务

## 当前结论

这一阶段优先做“可登记、可入库、可定位仓库目标”的最小链路，不扩展到分析、执行与回写。

## 进度

- [x] 已确定下一步为手动任务登记 MVP
- [x] 已完成实现计划
- [x] 已开始正式实现
- [x] 已完成实现与验证
