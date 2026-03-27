# FoxPilot 第二阶段 Dashboard 卡片与异常入口策略

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段 Dashboard 首页上的卡片、摘要块、异常入口应该如何组织，才能既像首页，又不会退化成杂乱告警墙。

如果没有这层策略，后面很容易出现：

- Dashboard 什么都想放
- 卡片越来越多
- 异常入口和 Focus Queue 重复
- 首页一打开像一面监控大屏

## 2. 定位

这份策略不是：

- 视觉排版稿
- Focus Queue 排序模型替代品
- Control Plane 状态模型替代品

它是：

> Dashboard 首页信息块和异常入口的收敛规则。

## 3. 第一原则

第二阶段 Dashboard 必须固定：

```text
卡片负责总览
异常入口负责导向
Focus Queue 负责优先级
```

不要让三者互相抢职责。

## 4. 第一批首页结构

建议第二阶段 Dashboard 固定为：

```text
Portfolio Summary
Task Summary
Run Summary
Health Summary
Control Plane Summary
Focus Queue
```

这 6 块之外，不再额外增加平级卡片。

## 5. 卡片与异常入口的区别

### 5.1 卡片

回答：

```text
整体现在怎么样
```

### 5.2 异常入口

回答：

```text
哪里出问题了
点哪里继续处理
```

### 5.3 Focus Queue

回答：

```text
现在最该先处理哪几个
```

## 6. 第一批异常入口来源

第二阶段异常入口建议只来自：

```text
foundation / config 问题
failed run
blocked handoff
degraded platform / skill / mcp
需要重新 init 的项目 / 仓库
```

## 7. 异常入口表现形式

第二阶段建议统一为：

```text
摘要卡中的异常徽标
异常列表入口
Focus Queue 高优对象
```

而不是：

```text
每块卡片都独立塞一长串问题列表
```

## 8. 卡片动作边界

Dashboard 卡片第一批建议只提供：

```text
查看详情
带筛选跳转
重新运行 doctor
进入 Init Wizard
```

不建议首页卡片直接承载：

```text
复杂 repair
批量 install / uninstall
批量 add / remove
```

## 9. 为什么 Focus Queue 不能被卡片替代

卡片只能告诉用户：

```text
有几个问题
```

但不能告诉用户：

```text
现在先处理哪个最划算
```

所以首页必须同时保留：

```text
摘要卡片
Focus Queue
```

## 10. 为什么异常入口不能变成第二个 Focus Queue

异常入口的目标是：

```text
帮助定位问题域
```

不是：

```text
重新排序所有对象
```

排序权仍然交给 Focus Queue。

## 11. 第一批首页节奏建议

建议 Dashboard 上半区：

- 先放 4 到 5 个摘要块
- 再放 Focus Queue

建议 Dashboard 下半区：

- 放异常入口区
- 放最近运行或最近事件短列表

## 12. 第一批范围控制

第二阶段第一批先不做：

- 趋势图表墙
- 多排卡片瀑布流
- 用户自定义首页布局
- 异常入口的复杂分组器

先固定：

```text
稳定六块首页
稳定异常入口来源
稳定卡片动作边界
```

## 13. 审核点

你审核这份策略时，重点看：

```text
1  是否接受 Dashboard 固定为六块首页结构
2  是否接受卡片、异常入口、Focus Queue 三者分工明确
3  是否接受异常入口只来自 foundation / failed run / blocked handoff / degraded control plane / 需要重新 init 的对象
4  是否接受首页卡片只做总览和导向，不做复杂写动作
```
