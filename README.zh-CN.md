# FoxPilot

[中文](./README.zh-CN.md) | [English](./README.en.md) | [日本語](./README.ja.md)

FoxPilot 是一个面向本地开发环境的多项目任务中控工具，用来把项目初始化、任务登记、任务查看和状态流转收拢到同一个本地 CLI 工作流里。

## 当前能力

- `foxpilot init` / `fp init`
  - 初始化项目
  - 生成 `.foxpilot/project.json`
  - 初始化全局配置和 SQLite
- `foxpilot config set-language`
  - 设置 CLI 交互语言
  - 支持 `zh-CN`、`en-US`、`ja-JP`
- `foxpilot task create`
  - 手动登记任务
- `foxpilot task list`
  - 按项目列出任务
  - 支持按状态、来源、执行器过滤
- `foxpilot task next`
  - 选出当前项目下一条最值得先推进的任务
  - 支持按来源、执行器过滤
- `foxpilot task edit`
  - 编辑任务标题、描述和任务类型
  - 支持显式清空描述
- `foxpilot task show`
  - 查看任务详情和目标
- `foxpilot task history`
  - 查看任务运行历史
- `foxpilot task import-beads`
  - 从本地 JSON 快照导入 Beads 任务
  - 按外部任务 ID 做幂等创建、更新和跳过
- `foxpilot task beads-summary`
  - 查看当前项目内 Beads 同步任务的聚合摘要
- `foxpilot task suggest-scan`
  - 按当前项目已登记仓库生成扫描建议任务
  - 自动跳过已有未完成建议的仓库
- `foxpilot task update-executor`
  - 更新任务当前责任执行器
  - 支持 `codex`、`beads`、`none`
- `foxpilot task update-priority`
  - 更新任务当前优先级
  - 支持 `P0`、`P1`、`P2`、`P3`
- `foxpilot task update-status`
  - 更新任务状态
  - 按最小合法流转规则校验状态变更

## 快速开始

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm verify:install
```

说明：

- `pnpm install` 会自动触发 `prepare`，生成 `dist/`
- `pnpm verify:install` 会打包当前仓库、安装到临时目录，并真实执行 `foxpilot init`

初始化当前项目：

```bash
foxpilot init
```

使用简写命令：

```bash
fp init
```

直接以源码模式运行 CLI：

```bash
pnpm cli init --help
pnpm cli task next --help
```

设置交互语言：

```bash
foxpilot config set-language --lang en-US
fp config set-language --lang ja-JP
```

## 命令示例

创建任务：

```bash
foxpilot task create --title "补充初始化注释"
```

查看任务列表：

```bash
foxpilot task list
foxpilot task list --source scan_suggestion --executor beads
```

查看下一条任务：

```bash
foxpilot task next
foxpilot task next --executor codex
```

编辑任务元数据：

```bash
foxpilot task edit --id task:example --title "补充任务说明" --task-type docs
foxpilot task edit --id task:example --clear-description
```

查看任务详情：

```bash
foxpilot task show --id task:example
```

查看任务历史：

```bash
foxpilot task history --id task:example
```

导入 Beads 快照：

```bash
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json
```

查看 Beads 聚合摘要：

```bash
foxpilot task beads-summary
```

生成扫描建议任务：

```bash
foxpilot task suggest-scan
```

更新任务执行器：

```bash
foxpilot task update-executor --id task:example --executor beads
```

更新任务优先级：

```bash
foxpilot task update-priority --id task:example --priority P0
```

更新任务状态：

```bash
foxpilot task update-status --id task:example --status executing
```

## 文档目录

- `docs/specs/`
  - 产品定义、数据模型、配置模型、SQLite 草案
- `docs/workspace/`
  - 任务计划、实现计划、进度记录

## 当前状态

当前仓库已经进入 CLI MVP 实现阶段，核心初始化、手动任务管理、Beads 本地快照导入、下一条任务选择、任务元数据编辑、扫描建议任务、执行器切换、优先级调整、任务历史查看和最小状态流转约束链路可用。后续会继续补齐更完整的协作编排能力。
