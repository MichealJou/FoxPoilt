# 任务：FoxPilot 第一阶段分发与安装 MVP

## 目标

在第一阶段本地 CLI 主线已经完成的前提下，补齐“首次安装可用”的分发层，让用户不需要进入仓库手工 `pnpm install`，而是能像常见 CLI 一样直接安装并在系统命令行中运行：

- `foxpilot`
- `fp`

同时预留统一更新入口：

- `foxpilot update`
- `fp update`

## 承接来源

- `docs/workspace/task-foxpilot-phase1-collaboration-orchestration-mvp.md`
- `README.zh-CN.md`
- `README.en.md`
- `README.ja.md`

## 当前范围

- 定义三条首次安装渠道：
  - `npm` 全局安装
  - `Homebrew` 安装
  - `GitHub Release` 安装脚本
- 定义安装完成后的统一命令入口
- 定义 `update` 命令如何按安装来源更新
- 定义安装元数据最小结构
- 定义跨平台边界：
  - macOS
  - Linux
  - Windows

## 设计约束

- 第一目标是“首次安装可用”，不是先做复杂更新器
- 更新命令必须统一为：
  - `foxpilot update`
  - `fp update`
- 更新行为默认沿用当前安装来源
- 不在第一版引入后台自动更新
- 不在第一版引入 GUI 安装器

## 完成标准

- 有正式设计文档，明确三种安装渠道与统一 update 规则
- 明确 `package.json`、发布产物、安装脚本、Homebrew tap 的边界
- 明确安装后如何记录安装来源
- 明确哪些内容属于第一版必须做，哪些延后

## 当前建议

- [x] 已确认先解决“第一次安装”
- [x] 已确认三条渠道都要：
  - npm
  - brew
  - GitHub Release
- [x] 已确认更新命令固定为：
  - `foxpilot update`
  - `fp update`
- [x] 已确认 update 沿用当前安装来源
- [x] 已输出正式设计文档
- [x] 已完成用户审阅与结构修正
- [x] 已输出正式实现计划
- [x] 已完成 npm 全局安装闭环：
  - `version`
  - `install-info`
  - `update`
  - 当前实例清单与全局索引
- [x] 已完成 npm 真实发布：
  - 包名：`foxpilot`
  - 版本：`0.1.0`
  - 安装命令：`npm install -g foxpilot --registry https://registry.npmjs.org`
- [x] 已完成 GitHub Release 安装脚本：
  - `scripts/install.sh`
  - `scripts/install.ps1`
  - `scripts/build-release-assets.sh`
- [x] 已完成外部发布自动化脚本：
  - `scripts/publish-github-release.sh`
  - `scripts/publish-homebrew-tap.sh`
- [x] 已完成 Homebrew formula 生成器：
  - `scripts/render-homebrew-formula.mjs`
  - `src/install/homebrew-formula.ts`
- [x] 已完成 GitHub Release 真实发布：
  - Release：`v0.1.0`
  - 资产：
    - `foxpilot-darwin-arm64.tar.gz`
    - `foxpilot-darwin-x64.tar.gz`
    - `foxpilot-linux-x64.tar.gz`
    - `foxpilot-win32-x64.zip`
- [x] 已完成 Homebrew tap 仓库与公式发布：
  - 仓库：`MichealJou/homebrew-tap`
  - Formula：`Formula/foxpilot.rb`
