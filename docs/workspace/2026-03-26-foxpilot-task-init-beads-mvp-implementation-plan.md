# FoxPilot Task Init Beads MVP Implementation Plan

## 目标

落地第一版 `foxpilot task init-beads` / `fp task init-beads`，让 `doctor-beads` 发现“仓库未初始化本地 Beads”后，用户可以直接在 FoxPilot 里补齐本地 `.beads` 环境。

## 任务拆分

### Task 1: 先写命令级失败测试

- 单仓库初始化成功
- 全仓库 `--dry-run`
- 已初始化仓库跳过
- 缺少目标参数
- 帮助输出与 `fp` 别名

### Task 2: 增加 bd init 适配层

- 在 sync 层补 `runBdInit`
- 保持与 `runBdList` / `runBdUpdate` 一致的 `execFile` 调用方式

### Task 3: 落命令层

- 解析项目与仓库选择器
- 判断仓库是否已初始化本地 `.beads`
- 按单仓库 / 全仓库模式执行
- 支持 `--dry-run`
- 输出汇总与逐仓库结果

### Task 4: 同步文档与安装验证

- README 中英日补命令说明
- 工作区任务文档登记完成
- 安装脚本真实执行一次 `task init-beads`

### Task 5: 全量验证

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`

## 风险点

- `init-beads` 是本地修复命令，不能顺手做同步或导入
- `--dry-run` 需要明确“不调用 bd init”
- 已初始化仓库必须稳定跳过，避免多次执行造成噪音
