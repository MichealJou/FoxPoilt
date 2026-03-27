# 任务：FoxPilot 第二阶段本地协作编排定义

## 目标

在第一阶段本地 CLI 主线已经完成的前提下，进入第二阶段产品定义：

- 定义安装阶段基础组合接管
- 定义 `init` 阶段的项目级 profile 选择
- 定义阶段 / 角色 / 平台三层编排规则
- 定义桌面端本地协作控制台的页面边界

## 承接来源

- `docs/specs/foxpilot-phase1-spec.md`
- `docs/specs/foxpilot-phase2-ui-design-brief.md`
- `docs/workspace/task-foxpilot-phase1-distribution-install-mvp.md`
- `docs/workspace/task-foxpilot-phase1-collaboration-orchestration-mvp.md`

## 当前范围

- 安装阶段基础组合：`Beads + Superpowers`
- `init` 阶段 profile 模型：
  - `default`
  - `collaboration`
  - `minimal`
- 阶段 / 角色 / 平台 编排模型
- 第二阶段桌面端控制台信息架构
- 第二阶段工具架构图与技术路线

## 设计约束

- 当前仍以产品定义为主，不直接进入完整编码实现
- 不把某一个平台桌面端当成公开控制接口
- 不把系统级基础组合与项目级 profile 混成一层
- 不先做远程服务化编排
- 不先做移动端优先界面
- 桌面端固定使用 `Tauri + React + Vite + shadcn/ui`
- Desktop 与 CLI 必须分开
- 两者共用 `Runtime Core`
- 阶段 / 角色 / 平台 必须拆开

## 关键结论

- 安装阶段负责基础组合接管
- `init` 阶段负责项目接管与 profile 选择
- 平台不进入组合选择，而由系统按阶段 / 角色 / 环境自动解析
- 第二阶段 UI 是第一阶段 CLI 的控制台，不是重做 CLI
- 第二阶段桌面壳固定为 `Tauri`
- 关键 CLI 命令仍可补 `--json`，但定位是脚本化接口
- `Skills / MCP` 管理必须走桌面端正式入口和 Runtime Core
- 执行平台层必须预留 `Codex / Claude Code / Qoder / Trae`

## 当前进度

- [x] 已确认第二阶段主线是“本地事件驱动协作编排”
- [x] 已确认安装阶段基础组合固定为 `Beads + Superpowers`
- [x] 已确认 `init` 阶段使用项目级 profile
- [x] 已确认采用阶段 / 角色 / 平台三层抽象
- [x] 已确认执行平台不进入组合选择，而由系统自动解析
- [x] 已完成第二阶段 UI 设计简报初稿
- [x] 已输出第二阶段主规格说明
- [x] 已输出第二阶段实现准备计划
- [x] 已确认第二阶段桌面技术栈为 `Tauri + React + Vite + shadcn/ui`
- [x] 已补第二阶段工具架构图
- [x] 已补 Runtime Core 目录结构设计
- [x] 已补平台适配器契约
- [x] 已补 Skills / MCP 管理模型
