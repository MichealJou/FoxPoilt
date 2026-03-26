# FoxPilot Task Export Beads MVP

## 目标

为当前 CLI 增加第一版 `foxpilot task export-beads` / `fp task export-beads`，把当前项目内已同步的 `Beads` 任务重新导出为本地 JSON 快照。

## 范围

- 支持 `--file <json-file>`
- 只导出当前项目内 `source_type = beads_sync` 的任务
- 导出格式与 `task import-beads` 兼容
- 自动忽略已取消的导入任务
- 支持跨项目隔离

## 导出协议

每条导出记录包含：

- `externalTaskId`
- `title`
- `status`
- `priority`
- `repository`

## 状态回映射规则

- `todo -> ready`
- `analyzing -> doing`
- `awaiting_plan_confirm -> doing`
- `executing -> doing`
- `awaiting_result_confirm -> doing`
- `blocked -> blocked`
- `done -> done`
- `cancelled -> 不导出`

## 设计约束

- 查询层直接返回仓库相对路径，命令层不自己拼仓库映射
- 导出时逐条校验本地记录，局部坏数据不拖垮整批导出
- 结果文件必须可直接被 `task import-beads` 再次导入

## 完成标准

- `task export-beads` 帮助、成功导出、空导出、跨项目隔离、缺少 file、SQLite bootstrap 失败都有测试
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm verify:install`
