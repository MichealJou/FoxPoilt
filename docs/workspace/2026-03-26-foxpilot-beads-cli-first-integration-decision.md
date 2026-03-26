# FoxPilot Beads CLI-First Integration Decision

## 背景

在 FoxPilot 第一阶段协作编排 MVP 中，我们一度把“真实 Beads API 网络同步”保留为最后一个未完成项。

但在 2026-03-26 对 Beads 官方文档做复核后，这个前提需要修正。

## 官方依据

### 1. FAQ 的集成建议

Beads 官方 FAQ 在 “Should I use CLI or MCP?” 一节明确写到：

- shell 可用时，推荐使用 `CLI + hooks`
- `MCP` 只在 CLI 不可用时使用

来源：

- https://steveyegge.github.io/beads/reference/faq

### 2. CLI Reference 的系统命令

Beads 官方 CLI Reference 已明确列出：

- `bd init`
- `bd info`
- `bd doctor`
- `bd hooks`
- `bd sync`
- `bd export`
- `bd import`

这说明官方主路径本身就是围绕本地 CLI 做集成，而不是要求先接独立网络 API。

来源：

- https://steveyegge.github.io/beads/cli-reference

### 3. 官方 README 的 Git-Free / CLI 用法

官方 README 进一步说明：

- `bd init --stealth` 可在本地独立使用
- `bd` 的核心命令可直接在本地运行
- 当前能力覆盖初始化、列表、更新、同步等完整工作流

来源：

- https://github.com/steveyegge/beads

## 结论

对于 FoxPilot 当前这条“本地开发环境 + shell 可用 + CLI 可安装”的产品路线：

- `bd` CLI 才是官方推荐的第一集成路径
- “真实 Beads API 网络同步”不应再作为第一阶段完成门槛
- 当前阶段的正确目标，是把本地 CLI 集成闭环做完整

## 对当前工作区的影响

这意味着当前第一阶段协作编排 MVP 的完成标准应调整为：

- 已完成本地快照导入 / 导出
- 已完成本地 `bd` 读取同步
- 已完成本地环境诊断与初始化
- 已完成单任务与批量回写
- 已完成安装后黑盒验证

而不是继续把“网络 API 对接”当成当前 shell 场景下的必做项。

## 后续只在什么情况下再看 API / MCP

只有当 FoxPilot 进入以下场景时，才需要重新打开这条线：

- 需要在无 shell 的环境下接入 Beads
- 需要做远程服务化同步，而不是本机 CLI 编排
- 需要跨机器或跨服务做非本地代理同步

在那之前，CLI-first 集成已经是当前阶段的正确完成边界。
