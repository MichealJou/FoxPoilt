# FoxPilot Task Import Beads MVP Implementation Plan

## 目标

落地第一版 `foxpilot task import-beads` / `fp task import-beads`，让本地 Beads 快照可以进入当前任务域，并保持可重复导入。

## 任务拆分

### Task 1: 扩展任务模型

- 给 `task` 增加 `external_source`、`external_id`
- 保持手工任务路径兼容
- 为现有数据库增加启动时自动补列逻辑

### Task 2: 补命令协议

- `parseArgs` 支持 `--file`
- `main` 分发到 `task import-beads`
- 定义命令参数类型和依赖类型

### Task 3: 先写失败测试

- 帮助输出
- 成功导入
- 重复导入跳过
- 快照变更触发更新
- 非法记录拒绝
- 跨项目隔离
- SQLite bootstrap 失败

### Task 4: 实现导入逻辑

- 读取 JSON 快照
- 逐条校验输入
- 映射 Beads 状态到本地状态
- 按外部来源键执行创建 / 更新 / 跳过

### Task 5: 同步说明文档

- README 中英日增加命令说明
- 产品模型与 SQLite 文档补字段说明
- 工作区任务文档登记完成

### Task 6: 全量验证

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`

## 风险点

- 老数据库不会自动因为 `CREATE TABLE IF NOT EXISTS` 补列
- 快照字段校验必须逐条拒绝，不能一条坏记录拖垮整批导入
- 仓库绑定必须沿用现有仓库主键规则，不能引入新的 repository id 规则
