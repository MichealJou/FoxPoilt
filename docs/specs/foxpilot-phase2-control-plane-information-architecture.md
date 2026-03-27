# FoxPilot 第二阶段中控平台信息架构

## 1. 文档目的

这份文档只定义第二阶段桌面端的中控平台信息架构。

它回答的问题是：

- 左侧导航应该怎么扩
- `Platforms / Skills / MCP` 应该如何归组
- 哪些页面属于任务视角
- 哪些页面属于中控视角

## 2. 总体原则

第二阶段 UI 不应该只按“数据表种类”拆页面，而应该按“用户心智”拆。

建议分成两大视角：

```text
1  工作流视角
2  中控视角
```

## 3. 一级导航建议

推荐一级导航如下：

```text
Dashboard
Projects
Tasks
Runs
Events
Control Plane
Settings / Health
```

## 4. 工作流视角

### 4.1 Dashboard

回答：

```text
现在整体怎么样
最值得先处理什么
```

### 4.2 Projects

回答：

```text
当前有哪些项目 / 仓库
哪些仓库状态异常
```

### 4.3 Tasks

回答：

```text
当前有哪些任务
任务处于哪个阶段
由哪个角色负责
分配给了哪个平台
```

### 4.4 Runs

回答：

```text
某次执行发生了什么
输出是什么
失败在哪里
```

### 4.5 Events

回答：

```text
哪个事件触发了什么动作
为什么推进到当前状态
```

## 5. 中控视角

### 5.1 Control Plane 页面组

建议 `Control Plane` 下面拆成三个页签：

```text
Platforms
Skills
MCP
```

#### Platforms

展示：

- 已探测平台
- 平台健康状态
- 支持能力
- 当前推荐用途
- 最近一次探测结果

#### Skills

展示：

- 已安装技能
- 技能来源
- 状态
- 版本
- doctor / repair 结果

#### MCP

展示：

- 已配置 MCP
- 状态
- 命令
- 配置来源
- 启停与 doctor 结果

## 6. 为什么不把 Platforms / Skills / MCP 混进 Settings

因为它们不是“次要设置项”，而是：

```text
FoxPilot 第二阶段的核心管理对象
```

如果把它们全塞进 `Settings`，后面会出现：

- 页面过重
- 重要性被弱化
- 用户找不到“平台中控”的中心入口

所以更合理的是：

```text
Settings / Health
负责环境、配置、版本、语言、路径

Control Plane
负责平台、skills、mcp 的运行态与管理态
```

## 7. 右侧上下文面板建议

在 `Control Plane` 组中，右侧面板应始终承担“当前选中对象详情”：

### Platforms 右侧面板

建议展示：

- 平台 ID
- 平台版本
- 平台能力
- 平台健康状态
- 探测理由
- 推荐阶段

### Skills 右侧面板

建议展示：

- 技能名称
- 来源
- 版本
- 状态
- 安装路径
- doctor 结果

### MCP 右侧面板

建议展示：

- Server 名称
- 命令
- 参数
- 状态
- 配置路径
- 最近错误

## 8. 第二阶段第一批页面优先级

建议优先级如下：

```text
P1  Dashboard
P1  Tasks
P1  Runs
P1  Project Init Wizard
P2  Control Plane / Platforms
P2  Control Plane / Skills
P2  Control Plane / MCP
P2  Settings / Health
P3  Projects
P3  Events
```

原因：

- 第一批先把主链路和中控入口建立起来
- 再逐步补全项目和事件页的深度能力

## 9. 审核点

你审核这份信息架构时，重点看：

```text
1  是否接受用 Control Plane 作为中控总入口
2  是否接受 Platforms / Skills / MCP 作为 Control Plane 子页
3  是否接受 Settings / Health 不再承担全部中控职责
4  是否接受 Tasks 页面直接展示 stage / role / platform
```
