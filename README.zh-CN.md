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
- `foxpilot task show`
  - 查看任务详情和目标
- `foxpilot task history`
  - 查看任务运行历史
- `foxpilot task update-status`
  - 更新任务状态

## 快速开始

```bash
pnpm install
pnpm typecheck
pnpm test
```

初始化当前项目：

```bash
foxpilot init
```

使用简写命令：

```bash
fp init
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
```

查看任务详情：

```bash
foxpilot task show --id task:example
```

查看任务历史：

```bash
foxpilot task history --id task:example
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

当前仓库已经进入 CLI MVP 实现阶段，核心初始化、手动任务管理和任务历史查看链路可用。后续会继续补齐更严格的状态流转规则、扫描建议和协作编排能力。
