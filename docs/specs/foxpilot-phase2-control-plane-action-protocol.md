# FoxPilot 第二阶段中控页面动作协议

## 1. 文档目的

这份文档定义第二阶段 `Platforms / Skills / MCP` 三个页面的动作协议。

它解决的问题是：

- 页面有哪些字段
- 用户可以触发哪些动作
- 哪些动作需要确认
- 动作如何映射到 Runtime 命令

如果没有这层协议，后面很容易出现：

- 页面字段和 CLI 返回结构对不上
- 页面按钮和 Runtime 命令对不上
- 同一类动作在不同页面叫法不一致

## 2. 协议定位

这份协议夹在三层之间：

```text
Desktop 页面
-> 页面动作协议
-> Runtime 命令模型
-> Runtime Core
```

所以它不是：

- 页面视觉稿
- CLI 命令定义本身
- Repository 数据结构

它只定义：

> UI 如何把“用户动作”翻译成 Runtime 能理解的标准操作。

## 3. 通用动作结构

建议所有页面动作统一成：

```ts
interface ControlPlaneActionRequest<TPayload = Record<string, unknown>> {
  target: 'platform' | 'skill' | 'mcp' | 'control-plane'
  action: string
  selection: {
    id: string | null
    ids: string[]
  }
  payload: TPayload
  confirmLevel: 'none' | 'soft' | 'hard'
}
```

## 4. 动作级别

### 4.1 安全动作

```text
list
inspect
capabilities
resolve
doctor
overview
```

特点：

- 默认不改状态
- 可以直接执行
- 一般不需要确认

### 4.2 状态动作

```text
enable
disable
detect
restart
```

特点：

- 会改变对象可用状态
- 建议使用 `soft` 确认
- 必须返回受影响对象摘要

### 4.3 风险动作

```text
install
uninstall
add
remove
repair
```

特点：

- 会改目录、配置或运行状态
- 必须提供确认提示
- `remove / uninstall` 建议用 `hard`

## 5. Platforms 页面协议

### 5.1 列表字段

建议第一批字段固定为：

```text
platformId
name
status
version
supportedStages
recommendedRoles
capabilities
lastCheckedAt
```

### 5.2 右侧详情字段

```text
platformId
version
status
capabilities
supportedStages
recommendedRoles
detectReasons
availableActions
healthSummary
lastCheckedAt
```

### 5.3 主动作

```text
inspect
detect
doctor
capabilities
resolve
```

### 5.4 批量动作

第一批建议只支持：

```text
detect all
doctor all
```

暂不建议第一批支持：

```text
批量 resolve
批量 capability-check
```

因为这两类动作更依赖项目上下文。

## 6. Skills 页面协议

### 6.1 列表字段

```text
skillId
name
status
enabled
version
source
installPath
lastCheckedAt
```

### 6.2 右侧详情字段

```text
skillId
name
version
source
status
enabled
installPath
manifestPath
healthSummary
lastCheckedAt
availableActions
```

### 6.3 主动作

```text
inspect
install
uninstall
enable
disable
doctor
repair
```

### 6.4 批量动作

第一批建议支持：

```text
doctor selected
enable selected
disable selected
```

第一批不建议支持：

```text
批量 uninstall
批量 repair
```

因为风险过高，且容易误伤本地环境。

## 7. MCP 页面协议

### 7.1 列表字段

```text
serverId
name
status
enabled
command
configPath
lastCheckedAt
```

### 7.2 右侧详情字段

```text
serverId
name
status
enabled
command
args
configPath
healthSummary
lastCheckedAt
availableActions
recentError
```

### 7.3 主动作

```text
inspect
add
remove
enable
disable
doctor
repair
restart
```

### 7.4 批量动作

第一批建议支持：

```text
doctor all
restart selected
enable selected
disable selected
```

第一批不建议支持：

```text
批量 remove
批量 repair
```

## 8. Control Plane 首页协议

Control Plane 首页不是另一个 Settings 页面，而是中控总览。

### 8.1 首页字段

建议固定为：

```text
platformCount
skillCount
mcpCount
readyCount
degradedCount
unavailableCount
recentDetectAt
recentDoctorAt
```

### 8.2 首页动作

第一批建议支持：

```text
overview refresh
platform detect all
platform doctor all
skill doctor all
mcp doctor all
```

## 9. 动作到 Runtime 命令映射

### 9.1 Platforms

```text
inspect       -> platform.inspect
detect        -> platform.detect
doctor        -> platform.doctor
capabilities  -> platform.capabilities
resolve       -> platform.resolve
```

### 9.2 Skills

```text
inspect       -> skill.inspect
install       -> skill.install
uninstall     -> skill.uninstall
enable        -> skill.enable
disable       -> skill.disable
doctor        -> skill.doctor
repair        -> skill.repair
```

### 9.3 MCP

```text
inspect       -> mcp.inspect
add           -> mcp.add
remove        -> mcp.remove
enable        -> mcp.enable
disable       -> mcp.disable
doctor        -> mcp.doctor
repair        -> mcp.repair
restart       -> mcp.restart
```

### 9.4 Control Plane 首页

```text
overview      -> controlPlane.overview
```

## 10. 确认与反馈规则

### 10.1 确认规则

```text
none  不需要确认
soft  次确认弹层
hard  需要明确输入或强调风险
```

建议默认：

```text
inspect / list / doctor / overview    -> none
enable / disable / detect / restart   -> soft
install / uninstall / add / remove    -> hard
repair                                -> soft 或 hard（按对象类型）
```

### 10.2 反馈规则

每个动作结束后，页面应至少拿到：

```text
是否成功
影响了哪些对象
是否建议刷新列表
是否有后续动作建议
```

## 11. 为什么要先定义动作协议

因为第二阶段已经明确：

```text
Desktop 和 CLI 分开
但都共享 Runtime Core
```

如果页面动作先随手做，后面会出现：

- 同一个动作在页面里叫 `recheck`
- 在 CLI 里叫 `doctor`
- 在 Runtime 里叫 `validate`

最终三套语言并存，维护成本很高。

所以必须先固定：

> 页面动作词汇 = Runtime 命令词汇的可视化投影

## 12. 审核点

你审核这份协议时，重点看：

```text
1  是否接受 Platforms / Skills / MCP 统一使用 动作 + 选择 + payload 模型
2  是否接受 Control Plane 首页作为单独 overview 动作入口
3  是否接受第一批批量动作只覆盖低风险操作
4  是否接受页面动作严格映射到 Runtime 命令，不允许 UI 自发明业务动作
```
