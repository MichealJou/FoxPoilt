# FoxPilot Task Push Beads MVP Implementation Plan

## 目标

落地第一版 `foxpilot task push-beads` / `fp task push-beads`，让 FoxPilot 已导入的 `Beads` 任务可以把本地编辑结果反向写回仓库里的 `bd` 数据。

## 任务拆分

### Task 1: 摸清 bd 最小写协议

- 采样 `bd update`
- 确认最小可回写字段：`title`、`description`、`priority`、`status`
- 验证空 description 是否能清空原始描述

### Task 2: 先写命令级测试

- 成功回写
- `--dry-run`
- 手工任务拒绝
- 仓库未初始化本地 Beads
- SQLite bootstrap 失败
- 帮助输出

### Task 3: 抽 bd 回写适配层

- 把 FoxPilot 状态折叠回 bd 状态
- 把 FoxPilot 优先级折叠回 bd 优先级
- 提供独立的 `runBdUpdate` 执行入口

### Task 4: 落命令层

- 解析项目与任务引用
- 校验任务是否为 Beads 导入任务
- 校验任务目标仓库是否存在本地 Beads 初始化
- 支持 `--dry-run`

### Task 5: 同步文档与安装验证

- README 中英日补命令说明
- 工作区任务文档登记完成
- 安装脚本真实执行一次回写并检查 `bd list` 输出

### Task 6: 全量验证

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`

## 风险点

- FoxPilot 的内部状态比 bd 更细，回写时一定会发生折叠
- 如果直接做批量回写，误操作面过大，因此第一版只做单任务
- 如果不先探测 `.beads`，会把“仓库没初始化”误报成 `bd update` 执行失败
