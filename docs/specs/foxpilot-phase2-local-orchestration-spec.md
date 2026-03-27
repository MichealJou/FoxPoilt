# FoxPilot 第二阶段本地协作编排规格说明

## 1. 阶段定位

FoxPilot 第一阶段已经完成本地 CLI 主线：

- 安装、更新、卸载
- 项目初始化
- 手动任务管理
- `Beads` 本地导入、同步、回写、导出、诊断

第二阶段不再继续补基础命令，而是进入：

> 本地协作编排阶段

这一阶段的目标，是把第一阶段已经做完的 CLI 能力升级为：

- 更完整的安装接管体验
- 更清晰的项目初始化体验
- 更稳定的多平台编排模型
- 更可见的桌面控制台

## 2. 第二阶段目标

第二阶段重点完成以下四件事：

### 2.1 安装阶段基础组合接管

安装 FoxPilot 后，系统应自动接管一套基础组合：

- `Beads`
- `Superpowers`

这套组合负责：

- 提供本地任务协作底座
- 提供方法层与流程约束
- 为后续项目接管和执行编排提供基础能力

### 2.2 项目级初始化接管

`foxpilot init` / `fp init` 在第二阶段不再只是“项目接入”，而是：

- 扫描项目
- 识别项目类型
- 选择项目 profile
- 探测阶段 / 角色 / 平台编排能力
- 记录项目接入结果

### 2.3 多平台编排模型

第二阶段不要求用户在初始化时手动指定某一个固定平台。

系统应根据：

- 项目类型
- 项目结构
- 本机环境
- 已安装平台
- 用户显式覆盖

自动决定当前项目在不同阶段应如何分配角色，并由哪个平台承担执行。

### 2.4 桌面端控制台

第二阶段需要一个桌面优先的本地协作控制台，用于可视化展示：

- 项目
- 仓库
- 任务
- 运行
- 事件
- `Skills`
- `MCP`
- 环境健康状态

这一层技术路线固定为：

- 桌面壳：`Tauri`
- 前端界面：`React + Vite + shadcn/ui`
- 入口模型：`Desktop` 与 `CLI` 分离
- 业务承接：共用 `FoxPilot Runtime Core`
- `CLI --json`：保留为脚本化与调试接口

### 2.5 中控平台能力

第二阶段的 FoxPilot 不再只是“有桌面端的 CLI”，而是升级为：

> 本地 AI 协作中控平台

这个中控平台统一管理：

- agent 平台
- skills
- mcp
- 项目 / 仓库 / 任务 / 运行 / 事件

## 6.5 中控平台入口

第二阶段桌面端不应只停留在任务与运行页面。

它还必须承接中控入口，用于统一管理：

- `Platforms`
- `Skills`
- `MCP`

推荐信息架构是：

- `Control Plane`
  - `Platforms`
  - `Skills`
  - `MCP`

## 3. 安装阶段模型

### 3.1 Foundation Pack

第二阶段把安装阶段的基础依赖定义为：

> Foundation Pack

当前默认内容固定为：

- `Beads`
- `Superpowers`

### 3.2 Foundation Pack 的职责

安装阶段负责：

- 检测是否已安装
- 缺失时按官方方式安装
- 写必要的系统级配置
- 校验安装结果
- 记录安装状态

### 3.3 Foundation Pack 不负责什么

安装阶段不负责：

- 项目级 profile 选择
- 项目级路径接管
- 某个执行平台的桌面端安装
- 远程服务化编排

## 4. init 阶段模型

### 4.1 职责

第二阶段 `init` 的定位是：

> 项目级接管向导

它负责：

- 识别当前项目
- 识别仓库结构
- 选择项目协作方式
- 生成项目协作快照
- 探测阶段 / 角色 / 平台编排能力
- 写项目配置

### 4.2 Profile 模型

第二阶段 `init` 支持项目级 profile。

第一版固定为 3 个：

#### default

推荐 profile。

启用能力：

- FoxPilot
- Beads
- Superpowers

适用：

- 标准开发项目
- 需要完整本地协作能力

#### collaboration

启用能力：

- FoxPilot
- Beads

适用：

- 只接任务来源与同步
- 暂不启用 Superpowers

#### minimal

启用能力：

- 仅 FoxPilot

适用：

- 轻量接入
- 环境受限

### 4.3 Profile 与 Foundation Pack 的关系

必须明确区分：

- Foundation Pack 是系统级安装能力
- Profile 是项目级协作方式

两者不能混成一层，否则后续会出现：

- 安装职责不清
- 初始化职责不清
- UI 信息架构混乱

### 4.4 Workflow Template 是独立层

第二阶段里，`Profile` 也不能直接替代工作流模板。

必须继续拆开：

- Profile 决定协作强度
- Workflow Template 决定阶段主链

否则后面：

- `fast-bugfix`
- `docs-heavy`
- `standard-software`

这类项目主链就无处落。

## 5. 阶段 / 角色 / 平台 模型

### 5.1 为什么必须引入这三层

FoxPilot 后续不是“接多个执行器”这么简单，而是：

```text
不同阶段
由不同角色负责
再分配给不同平台执行
```

例如：

```text
design     -> designer -> codex
implement  -> coder    -> claude_code
verify     -> tester   -> qoder
repair     -> fixer    -> trae
```

因此第二阶段必须明确：

```text
阶段 != 角色 != 平台
```

### 5.2 阶段

建议第一版至少覆盖：

- `analysis`
- `design`
- `implement`
- `verify`
- `repair`
- `review`

### 5.3 角色

建议第一版至少覆盖：

- `designer`
- `coder`
- `tester`
- `fixer`
- `reviewer`

### 5.4 平台

第二阶段平台层不写死成 `Codex`。

第一版必须按平台适配层设计，至少预留：

- `codex`
- `claude_code`
- `qoder`
- `trae`
- `manual`
- `future_platforms`

### 5.5 平台能力矩阵必须独立存在

第二阶段里，平台探测结果只解决：

```text
这个平台在不在
这个平台健不健康
```

它不能直接替代：

```text
这个平台擅长什么
能消费什么交接产物
更适合哪个角色
```

所以第二阶段必须补一层：

```text
Platform Capability Matrix
```

### 5.6 Skills / MCP 绑定必须进入正式依赖层

第二阶段里，`Skills / MCP` 不能只停留在 Control Plane 清单页。

系统还必须知道：

- 哪个工作流依赖它
- 哪个阶段依赖它
- 哪个平台依赖它
- 缺失时是阻塞还是降级

### 5.6.1 Workflow Template 必须独立存在

第二阶段里，`Profile` 不能直接替代工作流模板。

必须继续拆开：

- Profile 决定协作强度
- Workflow Template 决定阶段主链

### 5.6.2 交接产物必须使用统一目录

第二阶段里，`handoff.artifacts` 不能只是自由字符串集合。

必须有正式：

```text
Artifact Catalog
```

### 5.6.3 覆盖优先级必须统一

第二阶段里，模板、项目配置、用户覆盖和运行时临时覆盖都会同时影响结果。

所以必须有正式：

```text
Override Precedence Policy
```

### 5.6.4 Run 与 Execution Session 必须分层

第二阶段里，`Run` 不能直接吞掉所有平台执行细节。

必须继续拆出：

```text
Execution Session
```

来承接平台执行过程。

### 5.5 决策顺序

建议固定为：

1. 用户显式配置
2. 项目规则命中
3. 平台自动探测结果
4. 默认回退

### 5.10 第二阶段不做什么

第二阶段不应把某一个桌面端定义成必然可控的私有接口。

正确做法是把平台定义为：

- 可探测
- 可替换
- 可扩展

的执行平台集成层。

### 5.7 交接必须成为正式对象

第二阶段里，阶段推进不能只是：

```text
改 stage 字段
```

而必须形成：

```text
handoff
```

也就是：

- 当前阶段的摘要
- 下一阶段的角色
- 下一阶段的平台
- 必要的上下文交接包

### 5.8 写操作必须走正式变更面

第二阶段不允许页面或入口层自己拼写链。

必须固定为：

```text
Desktop / CLI
-> Runtime Mutation Surface
-> Event / refreshHints
```

### 5.9 高风险动作必须走统一确认策略

第二阶段里，以下动作都不能只靠页面自行判断：

- 基础组合安装
- 项目接管
- Skills / MCP 安装或移除
- 平台或阶段重分配

这些动作的确认口径必须由 Runtime Core 统一裁决。

## 6. 桌面控制台范围

第二阶段 UI 的定位是：

> 桌面优先的本地 AI 工程协作控制台

它承接第一阶段 CLI，但不替代全部 CLI。

### 6.1 技术路线

第二阶段桌面端固定采用：

- `Tauri`
- `React`
- `Vite`
- `shadcn/ui`

桌面端与现有能力的关系固定为：

- 桌面端负责窗口、页面、交互和可视化
- CLI 继续负责命令行和自动化入口
- 两者共用 `Runtime Core`

### 6.2 建议页面

建议先设计 7 个一级页面：

- Dashboard
- Projects / Repositories
- Tasks
- Run Detail
- Event / Hooks Timeline
- Skills / MCP
- Settings / Health

### 6.3 推荐布局

推荐使用：

- 左侧导航
- 中央主工作区
- 右侧上下文面板

### 6.4 第一优先级页面

如果设计资源有限，建议优先做：

- Dashboard
- Tasks
- Run Detail
- Project Init Wizard
- Skills / MCP

## 7. 第二阶段不做什么

为了控制复杂度，以下内容不进入第二阶段核心范围：

- 远程服务管理后台
- 多人实时协作
- 移动端优先适配
- 聊天窗口式主界面
- 依赖某个桌面端私有接口的强耦合方案

## 8. 第二阶段产出建议

第二阶段产品定义至少包含：

### 8.1 主规格

- 安装阶段基础组合定义
- `init` 阶段 profile 定义
- 阶段 / 角色 / 平台模型
- UI 信息架构
- 工具架构图

### 8.2 页面简报

- UI 设计简报
- 关键页面提示词
- 关键字段与交互说明
- Init Wizard 交互流

### 8.3 实现准备计划

实现准备计划建议拆成三条主线：

- 基础组合与 `init` 增强
- 桌面控制台前端壳与页面骨架
- 共享 Runtime 与平台集成层

### 8.4 架构文档

第二阶段应补一组独立架构说明，用于固定：

- `Tauri + React + Vite + shadcn/ui` 技术路线
- Desktop / CLI / Runtime 的边界
- `CLI --json` 的脚本化接口定位
- `Runtime Core` 的内部模块
- 协作集成层
- 执行平台集成层
- 阶段 / 角色 / 平台 关系
- Runtime Core 目录结构
- 平台适配器契约
- 平台能力矩阵
- Skills / MCP 管理模型
- Skills / MCP 绑定模型
- Workflow Template 模型
- 中控平台规格
- 中控平台信息架构
- 中控命令族设计
- 中控注册表模型
- Runtime 命令模型
- 中控页面动作协议
- 中控 JSON 返回结构
- 平台解析结果模型
- Runtime 变更面
- 风险确认策略
- 阶段 / 角色 / 平台交接模型
- Workflow Template 模型
- 平台能力矩阵
- Skills / MCP 绑定模型
- 交接产物目录
- 覆盖优先级策略
- Execution Session 生命周期
- Desktop Bridge 契约
- 桌面读模型契约
- Init Wizard 状态机
- 页面级数据契约
- 中控注册表更新与事件模型
- Runtime 查询面
- Control Plane 页面动作矩阵
- 读模型刷新策略

## 9. 当前结论

第二阶段的正确主线不是继续补 CLI 细节，而是：

- 把安装阶段做成更完整的基础能力接管
- 把初始化做成项目级接管向导
- 把执行模型升级为阶段 / 角色 / 平台三层
- 把第一阶段 CLI 底座提升为桌面控制台 + 共享 Runtime

当前推荐结构为：

- `Desktop` 与 `CLI` 作为双入口
- `Runtime Core` 作为唯一业务中枢
- `Tauri + React + Vite + shadcn/ui` 作为桌面层
- `Beads / Superpowers / Skills / MCP` 作为协作集成层
- `Codex / Claude Code / Qoder / Trae` 作为执行平台集成层
- `Runtime Mutation Surface` 作为正式写入口
- `Handoff` 作为阶段推进的正式交接对象
- `Risk Confirmation Policy` 作为高风险动作唯一确认规则
- `Workflow Template` 作为 Profile 与快照之间的正式层
- `Platform Capability Matrix` 作为 Detect 与 Resolve 之间的正式层
- `Skills / MCP Binding` 作为 Runtime 正式依赖层
- `Artifact Catalog` 作为 handoff 与平台消费的正式词表
- `Override Precedence Policy` 作为所有覆盖来源的统一裁决规则
- `Execution Session` 作为平台执行过程的正式对象
