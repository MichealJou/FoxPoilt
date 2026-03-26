# FoxPilot 使用手册

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

FoxPilot 是一个面向本地开发环境的任务中控 CLI，用来统一管理项目初始化、任务登记、任务流转，以及与本地 Beads 工作流的协作。

> 📌 你可以把 FoxPilot 理解成“本地项目任务控制台”。
>
> 它的目标不是替代远程项目管理平台，而是把你在终端里真正会用到的初始化、任务推进和本地协作命令收拢到一起。

## ✨ 简介

FoxPilot 不是通用脚手架，也不是远程项目管理平台。它更接近一个本地任务控制台：

- 先把当前目录初始化为受 FoxPilot 管理的项目
- 再用同一套命令登记、查看、筛选和推进任务
- 最后把本地任务和 Beads 快照、本地 `bd` 命令串成一条协作链

如果你希望在终端里完成“初始化项目、管理任务、和本地协作工具联动”这几件事，FoxPilot 就是为这个场景准备的。

## 🧱 背景

日常开发里经常会同时遇到几类问题：

- 项目初始化和后续任务推进是两套分散流程
- 手动任务、扫描建议任务、外部导入任务分散在不同上下文里
- 想把本地 Beads 工作流接进来时，缺一个统一的任务中控层
- 仓库越来越多后，很难快速判断“当前下一步该做什么”

FoxPilot 第一阶段解决的就是这个问题：先把本地 CLI 主线做稳，让项目、仓库、任务、Beads 协作都能在一个本地工作流里闭环。

## 🎯 适用场景

FoxPilot 目前适合下面几类场景：

- 你希望在本地终端里统一管理多项目任务
- 你已经在用或准备使用 Beads / `bd` 做本地任务协作
- 你需要把手动任务、扫描建议、外部导入任务放进同一个任务池
- 你希望先从 CLI 开始，而不是一开始就上桌面端或远程服务

## 🚀 安装

### 推荐顺序

如果你只是想快速装好并开始用，推荐顺序是：

1. 一键安装脚本
2. `npm` 全局安装
3. `Homebrew`
4. 手动使用 GitHub Release

### macOS

#### 方式 1：一键安装（推荐）

> 💻 适合大多数 macOS 用户。

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/foxpilot-install.sh | sh
```

#### 方式 2：Homebrew 安装

> 🍺 适合已经习惯用 Homebrew 管理 CLI 的用户。

```bash
brew install MichealJou/tap/foxpilot
```

#### 方式 3：npm 全局安装

```bash
npm install -g foxpilot --registry https://registry.npmjs.org
```

### Linux

#### 方式 1：一键安装（推荐）

> 🐧 适合大多数 Linux 用户。

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/foxpilot-install.sh | sh
```

#### 方式 2：npm 全局安装

```bash
npm install -g foxpilot --registry https://registry.npmjs.org
```

#### 方式 3：GitHub Release 安装脚本

```bash
curl -fsSL https://github.com/MichealJou/FoxPoilt/releases/latest/download/foxpilot-install.sh | sh
```

### Windows

#### 方式 1：一键安装（推荐）

> 🪟 适合 PowerShell 用户。

```powershell
irm https://github.com/MichealJou/FoxPoilt/releases/latest/download/foxpilot-install.ps1 | iex
```

#### 方式 2：npm 全局安装

```powershell
npm install -g foxpilot --registry https://registry.npmjs.org
```

### 安装后验证

> ✅ 装完以后，先跑这三条命令确认安装成功。

```bash
foxpilot version
foxpilot install-info
fp version
```

说明：

- `npm install -g foxpilot` 是全局安装，不是项目内局部依赖安装
- `foxpilot` 和 `fp` 是同一套 CLI 的完整名与简写
- 当前 GitHub Release 安装方式仍然依赖本机已有 `Node.js`

## 🧩 当前能力

| 名称 | 命令 | 说明 |
| --- | --- | --- |
| 项目初始化 | `foxpilot init` / `fp init` | 初始化当前项目，生成项目配置、全局配置和本地 SQLite |
| 语言设置 | `foxpilot config set-language` | 设置 CLI 交互语言，支持中文、英文、日文 |
| 版本与安装管理 | `foxpilot version` / `foxpilot install-info` / `foxpilot update` / `foxpilot uninstall` | 查看版本、安装来源，执行更新，或按当前安装来源执行卸载 |
| 手动任务创建 | `foxpilot task create` | 创建一条手动任务，并可指定优先级、类型、仓库 |
| 任务总览与筛选 | `foxpilot task list` | 列出当前项目任务，支持按状态、来源、执行器过滤 |
| 下一条任务建议 | `foxpilot task next` | 从当前项目中选出下一条最值得推进的任务 |
| 任务查看与历史 | `foxpilot task show` / `foxpilot task history` | 查看单任务详情、目标和任务历史记录 |
| 任务编辑与流转 | `foxpilot task edit` / `foxpilot task update-status` / `foxpilot task update-executor` / `foxpilot task update-priority` | 修改任务标题、描述、状态、执行器和优先级 |
| 扫描建议任务 | `foxpilot task suggest-scan` | 按已登记仓库自动补扫描建议任务 |
| Beads 导入与预演 | `foxpilot task import-beads` / `foxpilot task diff-beads` | 从快照导入 Beads 任务，或先只读预览差异 |
| Beads 本地同步与环境 | `foxpilot task sync-beads` / `foxpilot task doctor-beads` / `foxpilot task init-beads` | 直接从本地 `bd` 同步任务，并诊断或初始化本地 Beads 环境 |
| Beads 回写与导出 | `foxpilot task push-beads` / `foxpilot task export-beads` / `foxpilot task beads-summary` | 把任务状态回写到本地 `bd`，导出快照，并查看聚合摘要 |

## 🪄 怎么使用

### 1. 初始化项目

> 📦 在你希望托管的项目根目录执行。

```bash
foxpilot init
```

或者：

```bash
fp init
```

初始化后，FoxPilot 会在当前项目和用户目录下建立所需配置与本地数据库。

### 2. 创建和查看任务

> 📝 先有任务，再谈流转。

```bash
foxpilot task create --title "补充初始化说明"
foxpilot task list
foxpilot task next
```

这三条命令分别用于：

- 新建一条手动任务
- 查看当前项目任务列表
- 找出当前最值得先推进的一条任务

### 3. 推进任务状态

> 🔄 任务推进最常用的是“查看详情 → 更新状态 → 回看历史”。

```bash
foxpilot task show --id task:example
foxpilot task update-status --id task:example --status executing
foxpilot task history --id task:example
```

这条链路用于查看任务详情、推进任务状态、回看任务历史。

### 4. 使用 Beads 本地协作

> 🔗 如果你的项目已经在使用本地 `bd`，就从这组命令开始。

```bash
foxpilot task sync-beads --repository frontend
foxpilot task diff-beads --repository frontend
foxpilot task push-beads --repository frontend
foxpilot task beads-summary
```

这一组命令分别对应同步、差异预览、回写和聚合摘要。

## 🧠 核心概念

### project

FoxPilot 管理的项目根目录。  
初始化后会写入 `.foxpilot/project.json`，后续所有任务命令都以项目为边界工作。

### repository

项目下登记的代码仓库。  
扫描建议、Beads 同步、Beads 初始化等命令都可以按仓库范围执行。

### task

FoxPilot 的任务实体。  
任务可以来自手动创建、扫描建议，或外部导入，如 Beads 快照。

### Beads 协作

FoxPilot 当前支持的外部协作主线。  
它不是直接做远程 API 编排，而是围绕本地快照和本地 `bd` 命令形成闭环。

## 🧭 命令导航

### 系统命令

- `foxpilot version`
  - 查看当前 CLI 版本
- `foxpilot install-info`
  - 查看当前安装来源、版本和安装实例
- `foxpilot update`
  - 按当前安装来源执行更新
- `foxpilot uninstall`
  - 按当前安装来源执行卸载
  - 支持 `--purge` 同时删除 `~/.foxpilot`

### 初始化与配置命令

- `foxpilot init`
  - 初始化当前项目
- `foxpilot config set-language`
  - 设置交互语言，支持 `zh-CN`、`en-US`、`ja-JP`

### 手动任务命令

- `foxpilot task create`
- `foxpilot task list`
- `foxpilot task next`
- `foxpilot task edit`
- `foxpilot task show`
- `foxpilot task history`
- `foxpilot task update-status`
- `foxpilot task update-executor`
- `foxpilot task update-priority`
- `foxpilot task suggest-scan`

### Beads 协作命令

- `foxpilot task import-beads`
- `foxpilot task diff-beads`
- `foxpilot task sync-beads`
- `foxpilot task doctor-beads`
- `foxpilot task init-beads`
- `foxpilot task push-beads`
- `foxpilot task export-beads`
- `foxpilot task beads-summary`

完整命令说明请看：

- [FoxPilot CLI 命令参考（中文）](./docs/specs/foxpilot-cli-command-reference.zh-CN.md)

## 🗂 代码与目录说明

### 仓库根目录

- `README.md`
  - 默认中文使用手册
- `README.zh-CN.md`
  - 中文别名入口
- `README.en.md`
  - 英文主说明文档
- `README.ja.md`
  - 日文主说明文档

### src

- `src/cli/`
  - CLI 主入口、参数解析、运行时上下文
- `src/commands/`
  - 具体命令实现，按 `system`、`config`、`init`、`task` 分组
- `src/config/`
  - 全局配置和语言配置
- `src/project/`
  - 项目定位与项目配置读写
- `src/db/`
  - SQLite 初始化、任务存储、目录索引
- `src/sync/`
  - Beads 本地快照、本地 `bd` 协作相关服务
- `src/i18n/`
  - 多语言消息目录

### docs

- `docs/specs/`
  - 规格、模型、命令参考等相对稳定的文档
- `docs/plans/`
  - 分阶段实现计划
- `docs/workspace/`
  - 任务登记、阶段进度、设计决策记录

### tests

- `tests/cli/`
  - 命令级行为测试
- `tests/db/`
  - 数据存储与事务测试
- `tests/helpers/`
  - 测试辅助工具
- `tests/sync/`
  - 同步服务相关测试

## 📚 文档怎么读

如果你第一次接触这个仓库，建议按这个顺序阅读：

1. 先看当前这份 `README.md`
2. 再看 [FoxPilot CLI 命令参考（中文）](./docs/specs/foxpilot-cli-command-reference.zh-CN.md)
3. 如果你关心数据结构，再看 `docs/specs/` 下的数据模型和 SQLite 草案
4. 如果你关心开发过程，再看 `docs/workspace/` 和 `docs/plans/`

## 🛠 开发者源码运行

如果你是在当前仓库内参与开发，而不是作为终端用户安装，请使用下面这组命令：

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm verify:install
```

说明：

- `pnpm install` 只用于当前仓库开发
- `pnpm verify:install` 会打包当前仓库并在临时目录做真实安装验证

## 📍 当前状态

当前第一阶段本地 CLI 主线已经完成，重点能力包括：

- 项目初始化
- 手动任务管理
- 本地 Beads 快照导入、预演、收口、导出
- 本地 `bd` 同步、差异预览、诊断、初始化、回写
- 分发安装：一键脚本、`npm`、`Homebrew`、GitHub Release

下一阶段如果继续推进，重点会转向更自动化的本地协作编排，而不是再补基础 CLI 骨架。
