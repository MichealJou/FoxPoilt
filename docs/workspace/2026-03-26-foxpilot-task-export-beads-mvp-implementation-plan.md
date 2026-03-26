# FoxPilot Task Export Beads MVP Implementation Plan

## 目标

落地第一版 `foxpilot task export-beads` / `fp task export-beads`，让当前项目中的 `Beads` 同步任务可以重新导出为可回放的本地快照。

## 任务拆分

### Task 1: 先明确最小导出协议

- 与 `task import-beads` 复用字段名
- 保持 `externalTaskId / title / status / priority / repository`
- 明确内部状态回映射规则

### Task 2: 先写失败测试

- 帮助输出
- 成功导出
- 空导出
- 跨项目隔离
- 缺少 `--file`
- SQLite bootstrap 失败

### Task 3: 扩展查询层

- 新增当前项目内可导出 `beads_sync` 任务的最小投影
- 查询层直接返回仓库相对路径
- 排除 `cancelled` 任务

### Task 4: 实现导出命令

- 读取受管项目
- 查询导出候选
- 回映射内部状态到 Beads 快照状态
- 把导出结果写入目标 JSON 文件

### Task 5: 同步说明文档

- README 中英日补导出命令说明
- 安装验证脚本真实执行 `task export-beads`
- 工作区任务文档登记完成

### Task 6: 全量验证

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`

## 风险点

- 内部状态比外部快照协议更细，必须集中做回映射
- 已取消任务不应继续出现在导出快照里，否则会和 `close-missing` 语义冲突
- 导出协议必须保持可回放，不能引入只有本地系统才认识的字段
