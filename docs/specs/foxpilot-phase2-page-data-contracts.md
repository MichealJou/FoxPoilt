# FoxPilot 第二阶段页面级数据契约

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段第一批页面分别需要哪些数据、哪些动作、哪些刷新信号。

它服务于：

- UI 设计
- 前端实现
- Runtime 读模型设计

## 2. 页面级数据契约定位

页面级数据契约回答 3 个问题：

```text
1  页面初次打开要拿什么
2  页面可以触发什么动作
3  动作完成后应该刷新什么
```

## 3. Dashboard

### 3.1 首屏数据

```text
DashboardReadModel
HealthReadModel
ControlPlaneOverviewReadModel
```

### 3.2 刷新信号

```text
dashboard
health
controlPlane
```

## 4. Tasks

### 4.1 首屏数据

```text
TaskListReadModel
TaskFilterOptionsReadModel
```

### 4.2 详情侧栏数据

```text
TaskDetailReadModel
RunSummaryReadModel[]
```

### 4.3 主动作

```text
task.list
task.show
task.history
```

### 4.4 刷新信号

```text
tasks
runs
```

## 5. Runs

### 5.1 首屏数据

```text
RunDetailReadModel
TaskDetailReadModel（摘要）
```

### 5.2 刷新信号

```text
runs
tasks
```

## 6. Events

### 6.1 首屏数据

```text
EventTimelineReadModel
```

### 6.2 刷新信号

```text
events
tasks
runs
```

## 7. Control Plane

### 7.1 首页数据

```text
ControlPlaneOverviewReadModel
```

### 7.2 子页数据

```text
Platforms  -> PlatformListReadModel / PlatformDetailReadModel
Skills     -> SkillListReadModel / SkillDetailReadModel
MCP        -> MCPListReadModel / MCPDetailReadModel
```

### 7.3 主动作

```text
controlPlane.overview
platform.list / inspect / detect / doctor / resolve
skill.list / inspect / doctor / repair
mcp.list / inspect / doctor / repair / restart
```

### 7.4 刷新信号

```text
controlPlane
health
projectInit
```

## 8. Settings / Health

### 8.1 首屏数据

```text
HealthReadModel
InstallInfoReadModel
FoundationReadModel
```

### 8.2 刷新信号

```text
health
controlPlane
projectInit
```

## 9. Project Init Wizard

### 9.1 首屏数据

```text
InitWizardReadModel（空态）
```

### 9.2 提交流

```text
init.scan
init.preview
init.apply
```

### 9.3 刷新信号

```text
projectInit
tasks
dashboard
health
controlPlane
```

## 10. 页面间联动规则

### 10.1 Dashboard -> Tasks

点击摘要项后，应带筛选条件跳转到 `Tasks`。

### 10.2 Tasks -> Runs

任务详情中的最近运行，应直接跳转 `Runs`。

### 10.3 Tasks / Runs -> Control Plane

如果任务或运行绑定平台，应允许跳到对应平台详情。

### 10.4 Control Plane -> Project Init Wizard

如果平台解析结果过期，应允许回到 `Project Init Wizard` 重新跑预览 / 应用。

## 11. 页面层禁止事项

页面层必须禁止：

```text
自己拼 stage / role / platform
自己拼 control plane summary
自己直接改 skills / mcp 目录
自己直接调平台命令
自己判断 foundation 是否 ready
```

## 12. 审核点

你审核这份页面级数据契约时，重点看：

```text
1  是否接受每个页面都有明确的首屏数据、动作和刷新信号
2  是否接受第二阶段第一批页面优先做读主链和中控主链
3  是否接受页面跳转时带筛选和上下文，而不是重新猜
4  是否接受页面层禁止自己拼业务核心字段
```
