# 任务：FoxPilot 第一阶段 Beads 差异预览 MVP

## 目标

在 `task import-beads`、`--dry-run`、`--close-missing`、`task export-beads` 已经可用的前提下，补上一条纯只读的差异预览命令，让用户在真正导入前能直接看到会发生哪些创建、更新、跳过和收口动作。

## 范围

- 新增 `foxpilot task diff-beads` / `fp task diff-beads`
- 支持 `--file <json-file>`
- 支持 `--repository <repository-selector>`
- 支持 `--all-repositories`
- 支持 `--close-missing`
- 不真正写入 SQLite
- 复用现有导入命令的校验与幂等规则

## 设计约束

- 不能自造第二套导入判断逻辑
- 文件预览和本地 bd 预览必须复用同一套差异决策
- 差异预览的统计口径必须和真实导入一致
- 输出优先回答“会做什么”，而不是输出过长的逐字段 patch
- 非法记录继续进入 rejected 清单，不拖垮整批预览

## 输出目标

- `created`
- `updated`
- `skipped`
- `closed`
- `rejected`
- 一组可扫读的差异明细

## 完成标准

- `task diff-beads` 帮助、文件预览、本地仓库预览、全仓库预览、更新差异、`--close-missing` 预览、非法记录拒绝、缺少预览来源、SQLite bootstrap 失败都有测试
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`
