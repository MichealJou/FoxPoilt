# FoxPilot Task Init Beads MVP

## 目标

为当前 CLI 增加第一版 `foxpilot task init-beads` / `fp task init-beads`，让受管项目里的仓库可以补齐本地 `.beads` 初始化，作为 `task doctor-beads` 之后的最小修复入口。

## 范围

- 支持 `--repository <repository-selector>`
- 支持 `--all-repositories`
- 支持 `--dry-run`
- 只调用本地 `bd init`
- 已初始化仓库自动跳过
- 输出汇总和逐仓库结果

## 设计约束

- 不连接真实 Beads API
- 不写 FoxPilot SQLite
- 不默认初始化全仓库，必须显式传入 `--repository` 或 `--all-repositories`
- 仓库已初始化时不重复执行 `bd init`

## 完成标准

- `task init-beads` 的帮助输出、单仓库初始化、全仓库 `--dry-run`、已初始化跳过、缺少目标参数都有测试
- 三语 README 增加命令说明和示例
- 安装后验证脚本真实执行一次 `task init-beads --repository .`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`
