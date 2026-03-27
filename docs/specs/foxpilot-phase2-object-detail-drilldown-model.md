# FoxPilot 第二阶段对象详情钻取模型

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段桌面端里，不同对象从摘要态进入详情态时，应该怎样钻取、带哪些上下文、如何保持回退路径稳定。

如果没有这层模型，后面很容易出现：

- Dashboard、Workspace、Tasks、Runs 各自有一套钻取逻辑
- 用户点开详情后丢失原筛选条件
- 对象详情、右侧面板、详情页之间互相抢职责

## 2. 定位

对象详情钻取模型不是：

- 页面视觉稿
- 路由实现代码
- 右侧面板字段表

它是：

> 从“摘要对象”到“完整详情”的统一进入规则。

## 3. 第一原则

第二阶段对象钻取必须固定：

```text
摘要负责发现
右侧面板负责解释
详情页负责完整操作与追溯
```

## 4. 正式对象类型

建议第二阶段先支持：

```text
project
repository
task
run
event
platform
skill
mcp
health_issue
focus_item
```

## 5. 三层查看深度

建议统一为：

```text
L1  摘要层
L2  右侧上下文面板
L3  完整详情页
```

### 5.1 L1 摘要层

来源包括：

- Dashboard 卡片
- Focus Queue
- Workspace 列表
- Tasks 列表
- Runs 列表
- Control Plane 列表

### 5.2 L2 右侧上下文面板

负责：

- 解释当前对象
- 显示关系
- 提供轻量动作
- 给出跳入完整详情的入口

### 5.3 L3 完整详情页

负责：

- 展示完整上下文
- 展示历史 / 会话 / 交接
- 提供正式动作

## 6. 正式钻取结构

建议第二阶段统一为：

```ts
interface DrilldownContext {
  sourcePage: string
  sourceView?: string
  sourceFilter?: Record<string, string | boolean>
  selectedTarget: { kind: string; id: string }
  preserveSelection?: boolean
}
```

## 7. 钻取规则

### 7.1 Dashboard

从 Dashboard 点入对象时：

- 必须保留入口块来源
- 如果来自 Focus Queue，必须保留 `focusItemId`
- 如果点入 Tasks / Runs / Control Plane，需要带预置筛选

### 7.2 Workspace

从 Workspace 点入对象时：

- 必须保留当前 `projectId`
- 如果来自 `repositories view`，必须保留视图模式
- 返回时不能把用户丢回默认首页

### 7.3 Tasks

从 Tasks 列表点入 Task Detail 时：

- 必须保留列表筛选
- 必须保留排序与分页上下文
- 再从 Task Detail 跳 Run Detail 时，必须保留 `taskId`

### 7.4 Runs

从 Runs 列表点入 Run Detail 时：

- 必须保留当前 run 列表筛选
- 如果来自某个 task 上下文，必须保留 `taskId`

### 7.5 Control Plane

从 Platforms / Skills / MCP 列表点入对象时：

- 必须保留当前子页类型
- 必须保留 `ready / degraded / unavailable` 状态筛选

## 8. 详情页之间的跳转

第二阶段允许这些稳定跳转：

```text
Task -> Run
Task -> Handoff（展开或详情）
Task -> Platform
Run -> Task
Run -> Session
Run -> Platform
Event -> Task / Run / Control Plane
Workspace -> Health / Init Wizard
Dashboard -> Tasks / Runs / Control Plane / Health
```

## 9. 为什么必须保留 source context

第二阶段不能让详情页成为“黑洞”。

用户点进去之后必须能理解：

```text
我是从哪里来的
为什么来到这里
回去时应该回到哪个工作上下文
```

所以 `sourcePage / sourceView / sourceFilter` 必须成为正式对象。

## 10. 与右侧面板的关系

右侧面板不是详情页替代品。

统一关系应是：

```text
摘要点击 -> 右侧面板解释
右侧面板深挖 -> 完整详情页
```

但对于高确定性对象，也允许：

```text
摘要直接进入详情页
```

例如：

- failed run
- blocked handoff
- unavailable platform

## 11. 第一批范围控制

第二阶段第一批先不做：

- 面包屑历史栈可视化
- 多标签详情页
- 分屏对比两个对象
- 用户自定义钻取规则

先固定：

```text
稳定 drilldown context
稳定跨页跳转
稳定返回路径
```

## 12. 审核点

你审核这份模型时，重点看：

```text
1  是否接受 摘要 -> 右侧面板 -> 完整详情页 三层钻取
2  是否接受 drilldown context 必须保留 sourcePage / sourceView / sourceFilter
3  是否接受不同页面的钻取必须保留各自工作上下文
4  是否接受 failed run / blocked handoff / unavailable platform 可直接进入详情页
```
