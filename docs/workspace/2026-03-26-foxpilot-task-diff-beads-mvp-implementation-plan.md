# FoxPilot Task Diff Beads MVP Implementation Plan

## 目标

落地第一版 `foxpilot task diff-beads` / `fp task diff-beads`，让本地 Beads 快照在真正导入前可以先进行纯只读的差异预览。

## 任务拆分

### Task 1: 明确最小命令协议

- 命令名固定为 `task diff-beads`
- 支持 `--file`
- 支持 `--close-missing`
- 不真正写库

### Task 2: 先写失败测试

- 帮助输出
- 成功预览 create / update / skip
- `--close-missing` 预览
- 非法记录拒绝
- 缺少 `--file`
- SQLite bootstrap 失败

### Task 3: 抽可复用的预览决策层

- 复用现有快照标准化逻辑
- 复用现有 create / update / skip 判定
- 补一层纯只读预览结果构造

### Task 4: 实现命令编排

- 解析受管项目
- 读取快照文件
- 查询当前项目已导入任务
- 输出统计与差异明细

### Task 5: 同步说明文档

- README 中英日补命令说明
- 安装验证脚本真实执行 `task diff-beads`
- 工作区任务文档登记完成

### Task 6: 全量验证

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`

## 风险点

- 如果差异预览和真实导入使用两套逻辑，后续一定会漂移
- `--close-missing` 预览必须继续尊重“declared external id 不误收口”的保护
- 终端输出不能为了细节过度拉长，否则会丧失扫读价值
