# 任务：FoxPilot 第一阶段实现准备

## 目标

在不偏离当前产品定义成果的前提下，为 `FoxPilot init MVP` 的正式实现准备好统一入口和执行边界。

## 承接来源

本任务承接以下已完成文档：

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-config-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`
- `docs/specs/foxpilot-phase1-init-design.md`
- `docs/specs/foxpilot-phase1-init-cli-io.md`
- `docs/specs/sql/foxpilot-phase1-init.sql`
- `docs/workspace/2026-03-25-foxpilot-init-mvp-implementation-plan.md`

## 当前范围

- 明确当前实现入口固定为 `foxpilot init MVP`
- 明确执行时以实现计划为唯一任务拆分依据
- 明确技术假设只属于实现计划，不自动上升为产品规格
- 为后续正式编码准备任务入口

## 当前约束

- 当前工作区先以方案和模型设计为主
- 暂不展开桌面端实现
- 暂不展开任务系统完整实现
- 暂不展开 `Beads` 同步实现

## 实现入口

后续如果进入真正实现，默认从以下文档开始：

- `docs/workspace/2026-03-25-foxpilot-init-mvp-implementation-plan.md`

命令入口约定为：

- 完整命令：`foxpilot init`
- 简写命令：`fp init`

当前默认实现假设是：

- `TypeScript`
- `Node.js`
- `pnpm`
- `Vitest`
- `better-sqlite3`

注意：

- 这组技术假设只在实现计划中成立
- 如果后续决定改成别的实现栈，应先改实现计划，不直接改产品规格

## 暂不展开的内容

- `foxpilot init` 之后的任务创建与任务运行
- 多项目桌面端视图
- 复杂仓库扫描
- `Beads` 对接
- 记忆系统接入

## 进度

- [x] 第一阶段产品定义已完成
- [x] `FoxPilot init MVP` 规格与 SQL 草案已完成
- [x] `FoxPilot init MVP` 实现计划已完成
- [x] 已接受当前实现栈假设
- [x] 已进入 `FoxPilot init MVP` Task 1
- [x] 已启动正式实现
- [x] `FoxPilot init MVP` 已完成实现与验证
