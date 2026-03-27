# FoxPilot 第二阶段桌面导航信息架构

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段桌面端左侧导航到底如何分层，哪些应该是常驻入口，哪些只能作为条件流转入口。

如果没有这层信息架构，后面很容易出现：

- 左导航一开始就膨胀成十几个入口
- `Init Wizard` 和常规业务页面混在一起
- 页面路由和产品层级失真

## 2. 定位

这份文档不是：

- 视觉稿
- 页面组件清单
- 路由实现细节

它是：

> 桌面端导航边界的正式产品模型。

## 3. 第一原则

第二阶段桌面端必须固定：

```text
常驻导航承载“长期存在的工作区”
条件入口承载“阶段性流程”
右侧面板承载“当前选中对象解释”
```

## 4. 正式导航结构

建议第二阶段一级导航固定为：

```text
Dashboard
Workspace
Tasks
Runs
Events
Control Plane
Health
```

## 5. 为什么这样分

### 5.1 Dashboard

承接首页聚合层：

- Portfolio
- Tasks
- Runs
- Health
- Control Plane
- Focus Queue

### 5.2 Workspace

承接：

- Projects
- Repositories

不建议一开始把 `Projects` 与 `Repositories` 拆成两个一级入口，否则导航密度会过早膨胀。

### 5.3 Tasks

承接任务列表、筛选、详情跳转。

### 5.4 Runs

承接运行列表、运行详情、Execution Session 视图。

### 5.5 Events

承接事件时间线和交接链路。

### 5.6 Control Plane

承接：

- Platforms
- Skills
- MCP

### 5.7 Health

承接：

- Foundation 状态
- doctor 结果
- repair 建议
- 配置问题

## 6. Init Wizard 不是常驻一级导航

第二阶段应明确：

```text
Init Wizard 是条件流程入口
不是常驻一级导航
```

它可以从这些地方进入：

- Dashboard 空状态
- Dashboard 告警卡
- Health 页面异常项
- Workspace 尚未接管的项目

但它不应该长期占据左导航一个固定位置。

## 7. 建议的二级结构

### 7.1 Workspace

```text
Projects
Repositories
```

### 7.2 Control Plane

```text
Platforms
Skills
MCP
```

### 7.3 Health

```text
Foundation
Doctor
Repair History
Config Issues
```

## 8. 导航与页面边界

左导航只负责：

```text
进入长期工作区
切换一级页面
暴露有限二级入口
显示高优异常徽标
```

左导航不负责：

```text
承载复杂动作
承载对象详情
承载流程说明
```

这些分别应放在：

- 中央主区
- 右侧上下文面板
- 条件流程页

## 9. 导航状态建议

建议一级导航都支持：

- 激活态
- 徽标提示
- degraded 提示
- 待处理数量

但不要在左导航里直接展示太多统计数字。

第二阶段第一批建议只放：

- 未读 / 待处理数量
- 异常点
- 是否存在阻塞

## 10. 导航与路由关系

建议页面路由按：

```text
/dashboard
/workspace/projects
/workspace/repositories
/tasks
/runs
/events
/control/platforms
/control/skills
/control/mcp
/health
/init
```

其中：

```text
/init
```

是流程路由，不进入常驻导航模型。

## 11. 第一批范围控制

第二阶段第一批先不做：

- 用户自定义左导航
- 拖拽排序
- 收藏夹导航
- 可折叠多层树导航

先固定：

```text
稳定一级结构
有限二级结构
稳定条件入口
```

## 12. 审核点

你审核这份架构时，重点看：

```text
1  是否接受 Dashboard / Workspace / Tasks / Runs / Events / Control Plane / Health 七个一级入口
2  是否接受 Init Wizard 作为条件流程入口，而不是常驻导航
3  是否接受 Projects / Repositories 先收在 Workspace 下
4  是否接受 Platforms / Skills / MCP 先收在 Control Plane 下
```
