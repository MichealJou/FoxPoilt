# FoxPilot Task Sync Beads MVP Implementation Plan

## 目标

落地第一版 `foxpilot task sync-beads` / `fp task sync-beads`，让受管项目能直接从本机仓库里的 `bd list --json --all` 同步 Beads 任务，而不必先手工导出 JSON 快照。

## 任务拆分

### Task 1: 摸清 bd 最小协议

- 采样 `bd list --json --all`
- 明确最小可依赖字段：`id`、`title`、`status`、`priority`
- 确认命令执行上下文基于仓库根目录

### Task 2: 先写命令级测试

- 成功同步
- `--dry-run`
- 单仓库 `--close-missing`
- `--all-repositories`
- 缺少 `--repository`
- `bd list` 调用失败
- SQLite bootstrap 失败
- 帮助输出

### Task 3: 抽 bd 适配层

- 执行 `bd list --json --all`
- 解析 JSON
- 把 bd 状态和优先级映射到 FoxPilot 当前模型
- 产出可直接落库的标准化记录和 rejected 清单
- 增加“仓库是否已初始化本地 Beads”的最小探测

### Task 4: 复用现有导入落库层

- 把创建、更新、跳过、收口逻辑抽到共享同步层
- 让 `task import-beads` 和 `task sync-beads` 共用同一套落库规则
- 给 `close-missing` 增加仓库级过滤
- 支持对项目内全部仓库做聚合同步，并跳过未启用 Beads 的仓库

### Task 5: 同步文档与安装验证

- README 中英日补命令说明
- 安装脚本真实执行一次 `task sync-beads`
- 工作区任务文档登记完成

### Task 6: 全量验证

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`

## 风险点

- 如果 `task sync-beads` 和 `task import-beads` 维护两套落库逻辑，后续一定会漂移
- `bd` 的 `deferred`、`priority=4` 等值需要显式折叠映射，不能在命令层偷偷丢失
- 单仓库同步时若不限制收口范围，会误取消其他仓库的外部任务
