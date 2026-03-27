# FoxPilot 第二阶段 Workspace 摘要区块策略

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段 `Workspace` 页面里的摘要区块应该承载哪些信息，避免它和 Dashboard 的摘要块重复，或和仓库列表抢职责。

如果没有这层策略，后面很容易出现：

- Workspace 也想做成第二个 Dashboard
- 摘要区块和列表都展示同样的信息
- 项目层和仓库层信息混在一起

## 2. 定位

`Workspace` 摘要区块不是：

- Dashboard 总览
- Health 告警页
- Task Summary 复制品

它是：

> 与当前所选项目 / 仓库直接相关的工作区摘要层。

## 3. 第一原则

第二阶段 `Workspace` 摘要区块必须固定：

```text
只解释当前工作区对象
不重复全局首页聚合
优先服务跳转与接管
```

## 4. 第一批摘要区块

建议第二阶段固定为：

```text
Selection Summary
Repository Health Snapshot
Task Presence Snapshot
Init / Takeover Hint
```

## 5. 各块职责

### 5.1 Selection Summary

回答：

```text
当前选中了哪个项目 / 仓库
它当前总体状态如何
```

### 5.2 Repository Health Snapshot

回答：

```text
最近 sync / doctor / hooks / init-beads 是否正常
```

### 5.3 Task Presence Snapshot

回答：

```text
该项目 / 仓库下有没有活跃任务、阻塞任务、最近运行
```

### 5.4 Init / Takeover Hint

回答：

```text
是否还没接管
是否建议重新进入 Init Wizard
```

## 6. 为什么不能重复 Dashboard

Dashboard 回答的是：

```text
全局现在怎么样
```

Workspace 回答的是：

```text
这个项目 / 仓库现在怎么样
```

所以 Workspace 摘要不应该再展示：

- 全局项目总数
- 全局失败运行数
- 全局平台状态分布

## 7. 与列表的关系

列表负责：

```text
扫描多个项目 / 仓库
```

摘要区块负责：

```text
解释当前选中的一个对象
```

所以：

- 列表不替代摘要
- 摘要不替代列表

## 8. 第一批动作边界

建议 Workspace 摘要区块只提供：

```text
跳转 Tasks
跳转 Runs
跳转 Health
进入 Init Wizard
```

不建议直接在摘要块中承载：

```text
复杂 repair
批量接管
复杂写操作
```

## 9. 第一批范围控制

第二阶段第一批先不做：

- 图表化项目趋势
- 多项目聚合卡
- 自定义摘要块

先固定：

```text
稳定四块
稳定对象级摘要
稳定导流动作
```

## 10. 审核点

你审核这份策略时，重点看：

```text
1  是否接受 Workspace 摘要区块只解释当前选中对象，而不重复 Dashboard 全局摘要
2  是否接受 Selection / Health Snapshot / Task Presence / Init Hint 四块结构
3  是否接受 Workspace 摘要区块以导流为主，不承载复杂修复
4  是否接受列表与摘要明确分工
```
