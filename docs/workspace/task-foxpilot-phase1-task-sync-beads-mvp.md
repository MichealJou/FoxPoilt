# 任务：FoxPilot 第一阶段本地 Beads CLI 同步 MVP

## 目标

在 `task import-beads`、`task diff-beads`、`task export-beads` 已经可用的前提下，新增一条直接读取本机 `bd` 命令输出的同步命令，减少手工准备 JSON 快照的成本。

## 范围

- 新增 `foxpilot task sync-beads` / `fp task sync-beads`
- 支持 `--repository <repository-selector>`
- 支持 `--close-missing`
- 支持 `--dry-run`
- 从指定仓库执行 `bd list --json --all`
- 复用现有外部任务幂等创建、更新、跳过与收口逻辑

## 设计约束

- 不自造第三套导入规则
- 单仓库同步时，`--close-missing` 只能收口当前仓库绑定的任务
- 不猜测仓库，第一版要求显式传入 `--repository`
- 非法 `bd` 记录继续进入 rejected 清单，不拖垮整批同步

## 输出目标

- `created`
- `updated`
- `skipped`
- `closed`
- `rejected`

## 完成标准

- `task sync-beads` 帮助、成功同步、`--dry-run`、仓库级 `--close-missing`、缺少 `--repository`、`bd list` 失败、SQLite bootstrap 失败都有测试
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`
