# FoxPilot 第二阶段中控平台规格

## 1. 文档目的

这份文档只回答一个问题：

> FoxPilot 第二阶段为什么要升级成一个可统一管理多个 agent 平台、skills 和 MCP 的本地中控平台。

它不是页面稿，也不是代码实现计划。  
它只固定中控平台的职责边界、管理对象和核心能力。

## 2. 中控平台定位

第二阶段的 FoxPilot 不再只是：

```text
本地 CLI + 若干协作命令
```

而是升级为：

> 本地 AI 协作中控平台

这个平台要统一管理三类对象：

```text
1  Agent 平台
2  Skills
3  MCP
```

同时还要继续承接：

```text
项目
仓库
任务
运行
事件
环境健康
```

## 3. 为什么第二阶段就要做中控平台

因为一旦后续开始接：

- `Codex`
- `Claude Code`
- `Qoder`
- `Trae`
- 后续更多平台

FoxPilot 就不再是“单平台协作器”，而是：

```text
多平台协作编排中枢
```

如果现在不把中控平台能力收口，后面会出现：

- 平台接入分散
- skills 管理分散
- MCP 管理分散
- UI 页面越做越像零散工具箱

## 4. 中控平台要管理什么

### 4.1 Agent 平台

这里的 agent 平台指的是：

- `Codex`
- `Claude Code`
- `Qoder`
- `Trae`
- 后续平台

FoxPilot 要管理的不是“平台聊天窗口”，而是：

- 平台是否存在
- 平台是否健康
- 平台支持哪些能力
- 哪些阶段适合用哪个平台
- 当前任务的哪个阶段被分配给哪个平台

### 4.2 Skills

FoxPilot 要管理：

- 已安装技能
- 技能状态
- 技能启停
- 技能修复
- 技能来源和版本

### 4.3 MCP

FoxPilot 要管理：

- MCP 配置
- MCP Server 状态
- MCP 启停
- MCP 健康检查
- MCP 修复和重启

## 5. 中控平台的核心能力

第二阶段中控平台最少要具备以下能力。

### 5.1 统一注册表

FoxPilot 需要有一个统一视图，能够列出：

```text
当前有哪些 agent 平台
当前有哪些 skills
当前有哪些 mcp
各自是什么状态
```

这层是后面所有管理能力的基础。

### 5.2 统一健康检查

FoxPilot 需要把不同对象的健康状态统一成一个模型。

建议统一为：

```text
ready
degraded
unavailable
```

这样：

- Desktop 页面能统一显示
- CLI 能统一输出
- Runtime 能统一决策

### 5.3 统一管理动作

FoxPilot 需要提供一套统一管理动作，而不是每种对象都发明一套完全不同的话术。

例如：

```text
list
inspect
enable
disable
doctor
repair
```

然后按对象类型再补：

```text
skills: install / uninstall
mcp: add / remove / restart
platforms: detect / capability-check
```

### 5.4 统一编排视角

FoxPilot 不只是“能看到平台列表”，而是要能回答：

```text
当前任务属于哪个阶段
这个阶段需要什么角色
系统选择了哪个平台
这个平台依赖了哪些 skills / mcp
```

这才是“中控平台”的价值。

## 6. 中控平台与 Runtime Core 的关系

FoxPilot 中控平台不是一个独立于 Runtime 的新核心。

正确关系是：

```text
FoxPilot Control Plane
= Desktop / CLI 入口 + Runtime Core + Integrations 的可视化与管理能力
```

也就是说：

- `Runtime Core` 仍然是唯一业务核心
- 中控平台是 Runtime 的管理与观察形态
- 不是再造一个第二核心

## 7. 中控平台与 UI 的关系

第二阶段 UI 不能只是“任务页面 + 设置页面”。

它必须逐步演进成：

```text
Tasks
Runs
Events
Platforms
Skills
MCP
Health
```

其中：

- `Platforms` 页面负责 agent 平台视图
- `Skills` 页面负责技能视图
- `MCP` 页面负责 MCP 视图

## 8. 第二阶段第一批中控范围

为了控制复杂度，第二阶段第一批中控能力建议收在：

```text
1  平台注册表
2  Skills 列表与 doctor
3  MCP 列表与 doctor
4  平台解析结果展示
5  任务 -> 阶段 -> 角色 -> 平台 映射展示
```

这一版先不做：

```text
远程平台代理
多人共享平台池
复杂权限系统
跨机器调度
自动策略编辑器
```

## 9. CLI 与 Desktop 的分工

### 9.1 Desktop

负责：

- 统一可视化入口
- 列表、详情、筛选、关系图
- 平台 / skills / mcp 管理页面

### 9.2 CLI

负责：

- 自动化入口
- 脚本化入口
- 调试入口
- 无界面环境操作

但两者都必须通过：

```text
Runtime Core
```

不能直接各自去碰目录、SQLite 或外部工具。

## 10. 建议新增的一级页面

第二阶段 UI 的一级页面建议从原来的 6 到 7 个，扩成 8 个：

```text
Dashboard
Projects / Repositories
Tasks
Runs
Events
Platforms
Skills
MCP / Health
```

或者如果你更希望结构更紧凑，也可以：

```text
Dashboard
Projects
Tasks
Runs
Events
Control Plane
Settings / Health
```

其中 `Control Plane` 下面再拆：

- Platforms
- Skills
- MCP

## 11. 审核点

你审核这份规格时，重点看：

```text
1  是否接受第二阶段把 FoxPilot 定位成“本地中控平台”
2  是否接受中控平台统一管理 agent 平台 / skills / mcp
3  是否接受平台、skills、mcp 共享同一套健康与管理视角
4  是否接受第二阶段第一批先做“可见、可查、可修”，不急着做复杂远程控制
```
