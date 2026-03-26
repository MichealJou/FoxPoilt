# FoxPilot Task Push Beads MVP

## 目标

为当前 CLI 增加第一版 `foxpilot task push-beads` / `fp task push-beads`，把当前项目内已经从 `Beads` 导入的任务当前态回写到对应仓库的本地 `bd` 数据库。

## 范围

- 支持 `--id <task-id>` 与 `--external-id <external-task-id>`
- 支持 `--repository <repository-selector>`
- 支持 `--all-repositories`
- 仅支持回写 `external_source = beads` 的任务
- 支持 `--dry-run`
- 回写字段只包含：
  - `title`
  - `description`
  - `priority`
  - `status`

## 回写映射规则

- 状态回写：
  - `todo -> open`
  - `analyzing -> in_progress`
  - `awaiting_plan_confirm -> in_progress`
  - `executing -> in_progress`
  - `awaiting_result_confirm -> in_progress`
  - `blocked -> blocked`
  - `done -> closed`
  - `cancelled -> closed`
- 优先级回写：
  - `P0 -> 0`
  - `P1 -> 1`
  - `P2 -> 2`
  - `P3 -> 3`

## 设计约束

- 不创建新的 bd issue，只回写已导入任务
- 批量模式只支持按仓库或全仓库作用域回写，不支持任意筛选条件
- 不回写 `current_executor`、`task_type` 等 FoxPilot 本地编排字段
- 必须先确认目标仓库已经初始化本地 Beads，再执行 `bd update`

## 完成标准

- `task push-beads` 的帮助输出、单任务成功回写、仓库级批量回写、全仓库 `--dry-run`、手工任务拒绝、仓库未初始化、SQLite bootstrap 失败都有测试
- 安装后验证脚本真实执行一次单任务回写，并覆盖批量 `--dry-run`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`
