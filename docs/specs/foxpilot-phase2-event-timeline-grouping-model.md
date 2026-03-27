# FoxPilot 第二阶段事件时间线分组模型

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段 `Events` 页不应该只是扁平事件流，而应该如何分组，才能把“事件 -> 动作 -> 结果 -> 交接”看清楚。

如果没有这层模型，后面很容易出现：

- 时间线只是日志墙
- 用户看不出一串事件是不是同一次编排链
- `handoff`、`session`、`control plane` 事件散在一起

## 2. 定位

事件时间线不是：

- 原始事件表
- 纯日志页
- 失败消息列表

它是：

> 第二阶段编排链路的可视化解释页。

## 3. 第一原则

第二阶段 `Events` 页必须固定：

```text
先按链路分组
再按时间排序
最后才展开单条事件
```

## 4. 正式分组维度

建议第二阶段按这三个维度分组：

```text
correlationId
rootTarget
timelineKind
```

## 5. 第一批 timelineKind

建议第二阶段先支持：

```text
init_flow
task_flow
handoff_flow
session_flow
control_plane_flow
health_flow
```

## 6. 总链

```mermaid
flowchart LR
  Events["Runtime Events"] --> Grouping["Timeline Grouping Model"]
  Grouping --> Timeline["Event Timeline Groups"]
  Timeline --> UI["Events Page"]
```

## 7. 分组结果结构

建议第二阶段统一为：

```ts
interface TimelineGroup {
  correlationId: string
  timelineKind: string
  rootTarget: { kind: string; id: string }
  title: string
  summary: string
  status: 'running' | 'done' | 'failed' | 'blocked'
  events: RuntimeEventSummary[]
}
```

## 8. 为什么必须先分组

用户真正想看的是：

```text
这次任务是怎么从事件一路推进到结果的
```

而不是：

```text
09:31 发生了一个 event
09:31 又发生了一个 event
09:32 又发生了一个 event
```

所以第二阶段事件页必须优先展示：

```text
链路
```

而不是：

```text
原始记录
```

## 9. 第一批分组标题建议

### 9.1 init_flow

显示：

```text
项目初始化 / 接管流程
```

### 9.2 task_flow

显示：

```text
某个任务从触发到推进的链路
```

### 9.3 handoff_flow

显示：

```text
阶段 / 角色 / 平台交接链
```

### 9.4 session_flow

显示：

```text
某次平台执行会话的完整链
```

### 9.5 control_plane_flow

显示：

```text
平台 / skill / mcp 检测、doctor、repair 链路
```

### 9.6 health_flow

显示：

```text
foundation / config / doctor 问题流转
```

## 10. Timeline 页第一批交互

建议第二阶段先支持：

```text
按组展开 / 折叠
按状态筛选
按目标对象筛选
跳转 Task / Run / Control Plane 详情
```

先不支持：

```text
复杂可视化泳道
跨组拖拽
用户自定义分组
```

## 11. 与 Run / Handoff / Session 的关系

第二阶段必须明确：

- `Run` 是业务运行对象
- `Execution Session` 是平台执行过程对象
- `Handoff` 是阶段推进对象

时间线页必须能把这三者串起来，而不是混成一列状态字段。

## 12. 第一批范围控制

第二阶段第一批先固定：

```text
稳定分组维度
稳定 timelineKind
稳定组标题
稳定跳转链
```

## 13. 审核点

你审核这份模型时，重点看：

```text
1  是否接受 Events 页必须先按链路分组，而不是直接展示扁平事件流
2  是否接受 init / task / handoff / session / control plane / health 六种 timelineKind
3  是否接受 correlationId + rootTarget + timelineKind 共同决定一组时间线
4  是否接受第二阶段先做展开式链路，而不做复杂泳道图
```
