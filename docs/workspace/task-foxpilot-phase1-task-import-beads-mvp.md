# FoxPilot Task Import Beads MVP

## 目标

为当前 CLI 增加第一版 `foxpilot task import-beads` / `fp task import-beads`，把本地 JSON 快照里的 Beads 任务稳定导入到 FoxPilot 当前任务模型。

## 范围

- 支持 `--file <json-file>`
- 只支持本地 JSON 文件，不接真实网络接口
- 支持 `externalTaskId` 维度的幂等创建、更新、跳过
- 支持最小字段校验和拒绝清单输出
- 支持跨项目隔离

## 输入假设

每条 JSON 记录至少包含：

- `externalTaskId`
- `title`
- `status`
- `priority`
- `repository`

## 映射规则

- `source_type = beads_sync`
- `external_source = beads`
- `status`
  - `ready -> todo`
  - `doing -> executing`
  - `blocked -> blocked`
  - `done -> done`
- `current_executor = beads`
- `execution_mode = manual`
- `requires_plan_confirm = 1`

## 幂等规则

- 同项目内按 `external_source + externalTaskId` 命中已导入任务
- 当前态完全一致则记为 `skipped`
- 当前态存在差异则记为 `updated`
- 未命中则 `created`

## 兼容要求

- 老版本 `foxpilot.db` 启动时需要自动补齐 `task.external_source` / `task.external_id`
- 不要求用户手工删库或重建

## 完成标准

- `task import-beads` 帮助、成功导入、幂等更新、非法记录拒绝、跨项目隔离都有测试
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`
