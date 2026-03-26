# FoxPilot Task Doctor Beads MVP

## 目标

为当前 CLI 增加第一版 `foxpilot task doctor-beads` / `fp task doctor-beads`，用只读方式诊断当前项目的本地 Beads 环境是否具备“同步 / 回写”的最小前提。

## 范围

- 支持 `--repository <repository-selector>`
- 支持 `--all-repositories`
- 诊断项包含：
  - 项目是否已初始化
  - 全局 SQLite 是否可打开
  - 目标仓库是否已登记
  - 仓库是否已初始化本地 `.beads`
  - `bd list --json --all` 是否可执行且返回合法数组
- 输出单仓库或多仓库汇总结果
- 只读，不写数据库，不回写 `bd`

## 判定等级

- `ready`
  - 仓库已初始化本地 Beads，且 `bd list --json --all` 可成功返回任务数组
- `warning`
  - 仓库已受管，但未初始化本地 Beads
- `error`
  - 仓库已初始化本地 Beads，但 `bd list` 无法执行、返回非法 JSON，或返回值不是数组

## 设计约束

- 不接真实 Beads API
- 不创建或修改任何任务
- 不默认执行全仓库，必须显式传入 `--repository` 或 `--all-repositories`
- 多仓库模式下，只要存在 `warning` 或 `error`，命令退出码就返回 `1`

## 完成标准

- `task doctor-beads` 的帮助输出、单仓库 ready、全仓库 warning 汇总、非法 JSON error、缺少目标参数都有测试
- 三语 README 增加命令说明和示例
- 安装后验证脚本真实执行一次 `task doctor-beads --all-repositories`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`
