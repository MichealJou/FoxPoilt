# FoxPilot 第二阶段 Runtime 持久化模型

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段哪些对象应该落在 SQLite，哪些应该落在配置文件，哪些只作为派生读模型存在。

如果没有这层模型，后面会出现：

- `project.json` 越写越胖
- SQLite 又存一份重复配置
- 页面看到的是派生结果，但没人知道真相源在哪

## 2. 模型定位

第二阶段已经从单 CLI 工具升级成：

```text
Desktop / CLI 双入口
+ Runtime Core
+ 多平台 / Skills / MCP 中控
```

所以持久化不能再只停留在第一阶段的：

- 项目
- 仓库
- 任务
- 任务运行记录

必须补清楚第二阶段新增对象的落点。

## 3. 真相源分层

建议第二阶段固定为 4 层：

```text
1  静态声明层
2  配置层
3  运行历史层
4  派生读模型层
```

## 4. 静态声明层

这层放：

```text
Workflow Template Registry
Platform Capability Matrix
默认 Binding 规则
```

特点：

- 跟版本走
- 由代码和文档维护
- 不是用户运行时频繁改的东西

## 5. 配置层

这层放：

```text
全局配置
项目配置
显式覆盖
项目级绑定
```

建议文件：

```text
~/.foxpilot/foxpilot.config.json
<project>/.foxpilot/project.json
```

特点：

- 表示用户期望的目标状态
- 适合手动修改或由 init 写入
- 不适合写高频运行历史

## 6. 运行历史层

这层放在 SQLite，建议承接：

```text
task
task_run
execution_session
stage_handoff
runtime_event
control_plane_status_snapshot
```

特点：

- 高频写入
- 需要审计
- 需要历史查询

## 7. 派生读模型层

这层不作为真相源。

它负责把：

- 配置层
- 运行历史层
- 静态声明层
- 本地实时探测结果

拼成：

```text
DashboardReadModel
TaskDetailReadModel
ControlPlaneOverviewReadModel
InitWizardReadModel
```

## 8. 第二阶段新增对象落点

### 8.1 Workflow Template

```text
落点    静态声明层
原因    属于产品预置编排骨架
```

### 8.2 Platform Capability Matrix

```text
落点    静态声明层
原因    属于平台能力声明
```

### 8.3 Project Orchestration Inputs

```text
落点    project.json
内容    profile / template / overrides / project bindings
```

### 8.4 Project Orchestration Snapshot

```text
落点    SQLite
原因    属于运行时有效结果，需要审计和回放
```

### 8.5 Execution Session

```text
落点    SQLite
原因    属于高频运行历史
```

### 8.6 Stage Handoff

```text
落点    SQLite
原因    属于正式交接历史
```

### 8.7 Runtime Event

```text
落点    SQLite
原因    属于事件流和页面刷新基础
```

### 8.8 Skills / MCP / Platform 当前状态

```text
落点    SQLite 快照层
原因    需要展示最近检查结果与健康状态
```

## 9. 为什么 Project Snapshot 不直接写进 project.json

因为 `project.json` 应表示：

```text
用户想要什么
```

而 `snapshot` 表示：

```text
系统根据当前环境实际解析出来什么
```

这两者必须分开，否则：

- 用户值和系统值会混在一起
- 难以解释 recommended / effective
- 难以做历史回看

## 10. 第二阶段 SQLite 新实体建议

建议至少新增这些逻辑实体：

```text
project_orchestration_snapshot
execution_session
stage_handoff
runtime_event
control_plane_snapshot
```

## 11. 第二阶段配置文件边界

### 11.1 全局配置

适合放：

```text
语言
全局安装来源
全局默认策略
全局平台偏好
```

### 11.2 项目配置

适合放：

```text
selected profile
selected workflow template
explicit overrides
project-local bindings
```

### 11.3 不应该放进配置文件的内容

```text
session 状态
最近轮询时间
doctor 运行历史
handoff 历史
事件流
```

## 12. 审核点

你审核这份模型时，重点看：

```text
1  是否接受 静态声明 / 配置 / 历史 / 派生读模型 四层分法
2  是否接受 project.json 只存“用户输入”和显式覆盖，不存有效快照
3  是否接受 execution_session / stage_handoff / runtime_event 全部进入 SQLite
4  是否接受读模型不作为真相源
```
