# FoxPilot 第二阶段桌面路由状态策略

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段桌面端页面路由应该保存哪些状态、哪些写进 URL、哪些只保留在内存里、哪些必须在跨页时继承。

如果没有这层策略，后面很容易出现：

- 页面刷新后筛选全丢
- 返回列表后当前选中对象丢失
- 右侧面板状态和路由状态彼此冲突

## 2. 定位

这份文档不是：

- 路由库选型说明
- 浏览器历史实现
- 读模型契约替代品

它是：

> 桌面端页面状态与路由状态的统一保存规则。

## 3. 第一原则

第二阶段必须固定：

```text
可分享 / 可恢复的状态进路由
临时交互态留在页面内存
业务真相仍然来自 Runtime 读模型
```

## 4. 状态分层

建议第二阶段把页面状态拆成：

```text
Route State
View State
Transient UI State
```

### 4.1 Route State

应进入 URL / 路由参数：

- 当前页面
- 当前子页
- 关键筛选
- 当前对象 id
- 当前视图模式

### 4.2 View State

可以由页面局部存储：

- 表格列宽
- 展开 / 折叠组
- 当前分页

### 4.3 Transient UI State

只留在内存中：

- 悬浮
- 临时 toast
- 瞬时 loading
- 右键菜单

## 5. 正式路由状态建议

### 5.1 Dashboard

建议路由只保留：

```text
当前高亮块
当前 focusItemId（可选）
```

### 5.2 Workspace

建议路由保留：

```text
view=projects|repositories
projectId
repositoryId
filter
onlyDegraded
onlyUnmanaged
```

### 5.3 Tasks

建议路由保留：

```text
status
source
priority
stage
role
platform
repositoryId
taskId
```

### 5.4 Runs

建议路由保留：

```text
status
platform
taskId
runId
```

### 5.5 Events

建议路由保留：

```text
timelineKind
status
rootTargetKind
rootTargetId
correlationId
```

### 5.6 Control Plane

建议路由保留：

```text
tab=platforms|skills|mcp
status
query
selectedId
```

### 5.7 Health

建议路由保留：

```text
issueKind
status
targetKind
targetId
```

## 6. Init Wizard 的特殊规则

`Init Wizard` 是条件流程入口，不建议把整个步骤状态都塞进 URL。

第二阶段建议只保留：

```text
projectId
entrySource
```

步骤进度、preview 结果、表单中间态应保留在流程状态中，而不是暴露成复杂路由参数。

## 7. 右侧面板与路由关系

第二阶段必须明确：

```text
右侧面板选中对象
应尽量由当前路由对象决定
```

也就是说：

- `taskId` 在路由里，右侧可以稳态恢复 `TaskContextPanel`
- `runId` 在路由里，右侧可以稳态恢复 `RunContextPanel`

不要让右侧面板单独维护一套无法恢复的对象状态。

## 8. 返回行为

第二阶段返回列表时必须尽量恢复：

- 筛选条件
- 当前对象
- 当前分组视图
- 当前子页

不要每次返回都重置成默认页。

## 9. 为什么要单独写这份策略

因为第二阶段桌面端会越来越像中控平台。

如果路由状态不先固定，后面一定会发生：

- Dashboard 点进 Task Detail 再回 Tasks，筛选丢失
- Control Plane 切 tab 后选中对象消失
- Workspace 重新打开后不知道当前在哪个项目

## 10. 第一批范围控制

第二阶段第一批先不做：

- 跨设备同步路由状态
- 复杂 URL 压缩
- 多窗口状态同步

先固定：

```text
稳定 Route State
稳定页面恢复
稳定右侧面板恢复
```

## 11. 审核点

你审核这份策略时，重点看：

```text
1  是否接受可恢复状态进路由、瞬时状态留内存
2  是否接受 Tasks / Runs / Control Plane / Workspace 都有正式路由参数集合
3  是否接受 Init Wizard 只保留 projectId 和 entrySource，不把整个流程状态塞进 URL
4  是否接受右侧面板应尽量由当前路由对象恢复
```
