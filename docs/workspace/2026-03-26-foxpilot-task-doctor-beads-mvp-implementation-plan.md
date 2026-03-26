# FoxPilot Task Doctor Beads MVP Implementation Plan

## 目标

落地第一版 `foxpilot task doctor-beads` / `fp task doctor-beads`，让用户能在不写库、不回写 `bd` 的前提下，快速判断当前项目的本地 Beads 环境是否准备好。

## 任务拆分

### Task 1: 先写命令级失败测试

- 单仓库 `ready`
- 全仓库 mixed 结果
- 非法 JSON `error`
- 缺少目标参数
- 帮助输出与 `fp` 别名

### Task 2: 落诊断命令主体

- 解析项目与仓库选择器
- 探测全局 SQLite 是否可打开
- 探测仓库是否已初始化本地 `.beads`
- 执行 `bd list --json --all` 并判断结果是否合法
- 汇总 `ready / warning / error`

### Task 3: 同步文档与安装验证

- README 中英日补命令说明
- 工作区任务文档登记完成
- 安装脚本纳入 `task doctor-beads --all-repositories`

### Task 4: 全量验证

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`

## 风险点

- 诊断命令是只读工具，不能悄悄退化成“顺手同步”或“顺手修复”
- 多仓库模式里，未初始化本地 Beads 应该是 `warning`，不能误报为 `error`
- 需要同时保留“总体汇总”与“仓库明细”，否则命令可读性不足
