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
- `foxpilot version`
  - 查看当前 CLI 版本
- `foxpilot install-info`
  - 查看当前安装来源和已登记安装实例
- `foxpilot update`
  - 沿用当前安装来源执行更新
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
  - 支持通过 `--id` 或 `--external-id` 直接定位单任务
- `foxpilot task show`
  - 查看任务详情和目标
  - 支持直接查看导入任务的外部任务号
- `foxpilot task history`
  - 查看任务运行历史
  - 支持通过 `--external-id` 查看导入任务历史
- `foxpilot task import-beads`
  - 从本地 JSON 快照导入 Beads 任务
  - 按外部任务 ID 做幂等创建、更新和跳过
  - 支持 `--close-missing` 收口当前快照中已缺失的未完成导入任务
  - 支持 `--dry-run` 先预演导入结果而不写库
- `foxpilot task diff-beads`
  - 只读预览本地快照导入后会产生的创建、更新、跳过和收口差异
  - 支持 `--file`、`--repository`、`--all-repositories`
  - 复用真实导入的同一套校验和幂等规则
- `foxpilot task sync-beads`
  - 直接从指定仓库的 `bd list --json --all` 同步本地 Beads 任务
  - 支持 `--dry-run`、仓库级 `--close-missing` 与 `--all-repositories`
- `foxpilot task doctor-beads`
  - 只读诊断当前项目的本地 Beads 环境
  - 支持 `--repository` 与 `--all-repositories`
- `foxpilot task init-beads`
  - 为当前项目的仓库初始化本地 `.beads` 环境
  - 支持 `--repository`、`--all-repositories` 与 `--dry-run`
- `foxpilot task push-beads`
  - 把单条已导入的 Beads 任务当前态回写到本地 `bd` 仓库
  - 支持 `--id`、`--external-id`、`--repository`、`--all-repositories` 与 `--dry-run`
- `foxpilot task export-beads`
  - 把当前项目中的 Beads 同步任务重新导出为本地 JSON 快照
  - 导出结果与 `import-beads` 协议兼容，可直接回喂
  - 自动忽略已取消的导入任务
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

### 用户安装

当前已正式发布 3 种安装方式：

- 所有平台
  - `npm` 全局安装
  - 命令：`npm install -g foxpilot --registry https://registry.npmjs.org`
- macOS / Linux
  - `Homebrew` 安装
  - 命令：`brew install MichealJou/tap/foxpilot`
- macOS / Linux
  - `GitHub Release` 安装脚本
  - 命令：`curl -fsSL https://raw.githubusercontent.com/MichealJou/FoxPoilt/main/scripts/install.sh | sh`
- Windows
  - `GitHub Release` 安装脚本
  - 命令：`irm https://raw.githubusercontent.com/MichealJou/FoxPoilt/main/scripts/install.ps1 | iex`

安装完成后可直接验证：

```bash
foxpilot version
foxpilot install-info
fp version
```

说明：

- `npm install -g` 是系统级全局安装，不是项目内局部依赖安装
- `Homebrew` 与 `GitHub Release` 都已经正式发布
- 当前 `GitHub Release` 安装包仍然依赖本机已有 `Node.js`

### 开发者源码运行

如果你是在当前仓库里参与开发，再使用下面这组命令：

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm verify:install
```

说明：

- `pnpm install` 只用于当前仓库开发，不是给终端用户的正式安装命令
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

查看当前版本、安装信息和更新：

```bash
foxpilot version
foxpilot install-info
foxpilot update --help
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
foxpilot task edit --external-id BEADS-1001 --title "同步后的标题修正"
```

查看任务详情：

```bash
foxpilot task show --id task:example
foxpilot task show --external-id BEADS-1001
```

查看任务历史：

```bash
foxpilot task history --id task:example
foxpilot task history --external-id BEADS-1001
```

导入 Beads 快照：

```bash
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json --close-missing
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json --dry-run --close-missing
```

预览 Beads 快照差异：

```bash
foxpilot task diff-beads --file ./examples/beads-snapshot.sample.json
foxpilot task diff-beads --file ./examples/beads-snapshot.sample.json --close-missing
foxpilot task diff-beads --repository frontend
foxpilot task diff-beads --all-repositories
```

直接从本地 `bd` 仓库同步：

```bash
foxpilot task sync-beads --repository frontend
foxpilot task sync-beads --repository frontend --dry-run
foxpilot task sync-beads --repository frontend --close-missing
foxpilot task sync-beads --all-repositories
```

诊断本地 Beads 环境：

```bash
foxpilot task doctor-beads --repository frontend
foxpilot task doctor-beads --all-repositories
```

初始化本地 Beads 环境：

```bash
foxpilot task init-beads --repository frontend
foxpilot task init-beads --all-repositories --dry-run
```

把修改后的单任务回写到本地 `bd`：

```bash
foxpilot task push-beads --external-id BEADS-1001
foxpilot task push-beads --id task:example --dry-run
foxpilot task push-beads --repository frontend
foxpilot task push-beads --all-repositories --dry-run
```

导出 Beads 快照：

```bash
foxpilot task export-beads --file ./tmp/beads-export.json
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
foxpilot task update-executor --external-id BEADS-1002 --executor codex
```

更新任务优先级：

```bash
foxpilot task update-priority --id task:example --priority P0
foxpilot task update-priority --external-id BEADS-1002 --priority P0
```

更新任务状态：

```bash
foxpilot task update-status --id task:example --status executing
foxpilot task update-status --external-id BEADS-1001 --status analyzing
```

## 文档目录

- `docs/specs/`
  - 产品定义、数据模型、配置模型、SQLite 草案
- `docs/workspace/`
  - 任务计划、实现计划、进度记录

## 当前状态

当前仓库已经进入 CLI MVP 实现阶段，核心初始化、手动任务管理、Beads 本地快照导入、差异预览、本地同步、本地环境诊断、本地环境初始化、单任务与批量回写、导出、下一条任务选择、任务元数据编辑、扫描建议任务、执行器切换、优先级调整、任务历史查看和最小状态流转约束链路可用。后续会继续补齐更完整的协作编排能力。
