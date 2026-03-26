# 任务：FoxPilot 第一阶段协作编排 MVP

## 目标

在 `init + 手动任务管理 CLI` 已完成的前提下，进入下一阶段主线：定义第一版 `Beads + FoxPilot + Codex` 的协作编排边界与最小同步闭环。

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase1-data-model.md`
- `docs/specs/foxpilot-phase1-sqlite-schema.md`
- `docs/workspace/session-import-019cd6dc-d22c-7562-ba47-2a6a7091479f.md`

## 当前范围

- 定义 `Beads` 任务进入 FoxPilot 的最小同步入口
- 定义“同步层”和“编排层”的职责边界
- 定义 `beads_sync` 任务的去重、映射和更新规则
- 定义第一版最小命令入口，而不是直接接真实外部系统

## 设计约束

- 不直接接真实 `Beads` API
- 不在这一阶段引入桌面端
- 不引入复杂 workflow template
- 不引入自动执行策略表

## 暂不展开的内容

- `Beads` 的真实鉴权与网络同步
- 多来源任务冲突合并
- 自动 executor policy
- 桌面端编排视图

## 进度

- [x] 已确定下一阶段主线转向协作编排
- [x] 已完成第一版设计文档
- [x] 已完成 `task import-beads` 本地快照导入 MVP
- [x] 已补齐外部来源幂等键与老库兼容迁移
- [x] 已把 Beads 导入逻辑抽到独立同步服务
- [x] 已补齐 `--close-missing` 缺失任务收口能力
- [x] 已补齐 `--dry-run` 导入预演能力
- [x] 已补齐 `task export-beads` 本地快照导出能力
- [x] 已形成“导入 / 预演 / 收口 / 摘要 / 导出”的本地闭环
- [ ] 待拿到真实 `Beads` API 契约后进入网络同步实现
