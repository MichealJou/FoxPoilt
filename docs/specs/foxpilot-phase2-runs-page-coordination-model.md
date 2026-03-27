# FoxPilot 第二阶段 Runs 页面协同模型

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段 `Runs` 页面应该如何同时承接运行列表、运行详情、Execution Session、交接结果，避免它既不像列表页也不像详情页。

如果没有这层模型，后面很容易出现：

- `Runs` 只剩一个详情页
- `Run` 和 `Execution Session` 混成一层
- 从 `Tasks` 跳进来后上下文丢失

## 2. 定位

`Runs` 页面不是：

- 纯日志页
- 单条 run 的独占详情页
- Task Detail 的附属区块

它是：

> 运行扫描、运行追溯、Execution Session 解释和结果承接的统一页面。

## 3. 第一原则

第二阶段 `Runs` 页面必须固定：

```text
先看 run 列表
再看当前 run 详情
同时承接 execution session
```

## 4. 页面结构建议

建议第二阶段 `Runs` 页面统一为：

```text
左侧运行列表
中间 run 详情主区
右侧上下文面板
```

不要把 `Runs` 第一批做成只剩单页详情。

## 5. 正式对象关系

第二阶段必须明确：

```text
Run = 业务运行对象
Execution Session = 平台执行过程对象
Handoff = 阶段交接对象
```

`Runs` 页面必须能同时解释这三者关系。

## 6. 第一批列表字段

建议第二阶段运行列表固定展示：

```text
runId
状态
taskId / taskTitle 摘要
平台
阶段
开始时间
结束时间
session 状态摘要
```

## 7. 第一批详情主区必须解释的内容

建议第二阶段 `Run Detail` 主区固定承接：

```text
触发来源
输入上下文摘要
执行摘要
输出结果摘要
变更文件摘要
测试结果摘要
错误信息摘要
handoff 准备结果
```

## 8. session 展示边界

第二阶段 `Runs` 页不能把 session 藏起来。

至少必须解释：

```text
session 状态
externalRunId
最近轮询时间
collecting 状态
终态结果
```

## 9. 与 Tasks 的关系

从 `Tasks` 跳进 `Runs` 时，必须保留：

```text
taskId
来源筛选
```

这样用户才能理解：

```text
我是看这个任务的哪些运行
```

而不是被扔进全局运行页。

## 10. 第一批动作边界

`Runs` 页第一批建议只开放：

```text
查看 run 详情
查看 session 状态
查看 handoff 摘要
run.cancel
跳回 task
跳到 platform
```

不建议第一批直接在 `Runs` 页开放：

```text
复杂重跑编排
跨 run 批量操作
平台配置变更
```

## 11. 为什么要单独建模

如果不单独约束，后面最常见的问题就是：

- `Runs` 页面变成纯详情页
- 扫描失败 run 的能力消失
- session 字段散落到右侧面板和详情页各一半

所以这一页必须被当成：

```text
列表 + 详情 + 会话解释
```

的联合页面来设计。

## 12. 第一批范围控制

第二阶段第一批先不做：

- 多 run 对比
- 泳道式执行图
- session 调试控制台
- 历史回放播放器

先固定：

```text
稳定运行列表
稳定 run 详情
稳定 session 摘要
稳定 handoff 结果区
```

## 13. 审核点

你审核这份模型时，重点看：

```text
1  是否接受 Runs 页第一批必须同时包含 列表 + 详情 + session 解释
2  是否接受 Run / Execution Session / Handoff 三层对象在这页同时被解释
3  是否接受从 Tasks 跳进 Runs 时必须保留 task 上下文
4  是否接受 Runs 页第一批动作集中在查看、取消、跳转，而不是复杂重跑和平台变更
```
