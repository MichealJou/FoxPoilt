# FoxPilot 第二阶段中控命令族设计

## 1. 文档目的

这份文档定义第二阶段中控平台的命令族。

目标是统一：

- `Desktop` 的页面动作
- `CLI` 的命令动作
- `Runtime Core` 的管理动作

避免出现：

```text
UI 有自己的管理语言
CLI 有另一套命令语言
Runtime 再有第三套内部动作
```

## 2. 第二阶段新增命令族

建议第二阶段新增三组正式命令：

```text
foxpilot platforms ...
foxpilot skills ...
foxpilot mcp ...
```

简写同样支持：

```text
fp platforms ...
fp skills ...
fp mcp ...
```

## 3. `platforms` 命令族

### 3.1 目标

用于管理多个 agent 平台的注册、探测、能力和健康状态。

### 3.2 建议子命令

```text
platforms list
platforms inspect
platforms detect
platforms doctor
platforms capabilities
platforms resolve
```

### 3.3 含义

#### `platforms list`

列出当前本机已识别的平台。

#### `platforms inspect --platform <id>`

查看某个平台的详细信息：

- 版本
- 状态
- 能力
- 最近检查时间

#### `platforms detect`

重新探测本机可用平台。

#### `platforms doctor`

对平台层做整体健康检查。

#### `platforms capabilities --platform <id>`

查看某个平台支持哪些阶段和能力。

#### `platforms resolve --project <id>`

查看某个项目在当前环境下的阶段 / 角色 / 平台解析结果。

## 4. `skills` 命令族

### 4.1 目标

用于统一管理技能生命周期。

### 4.2 建议子命令

```text
skills list
skills inspect
skills install
skills uninstall
skills enable
skills disable
skills doctor
skills repair
```

### 4.3 说明

`skills list`  
查看技能清单与状态。

`skills inspect --skill <id>`  
查看技能详情。

`skills install --source <...>`  
安装技能。

`skills uninstall --skill <id>`  
卸载技能。

`skills enable --skill <id>` / `skills disable --skill <id>`  
控制启停。

`skills doctor`  
检查技能目录完整性和状态。

`skills repair --skill <id>`  
修复损坏的技能记录或目录。

## 5. `mcp` 命令族

### 5.1 目标

用于统一管理 MCP 配置与服务状态。

### 5.2 建议子命令

```text
mcp list
mcp inspect
mcp add
mcp remove
mcp enable
mcp disable
mcp doctor
mcp repair
mcp restart
```

### 5.3 说明

`mcp list`  
列出 MCP server。

`mcp inspect --server <id>`  
查看某个 MCP 的命令、参数、状态、配置路径。

`mcp add --source <...>`  
新增 MCP 配置。

`mcp remove --server <id>`  
移除 MCP 配置。

`mcp enable` / `mcp disable`  
控制是否启用。

`mcp doctor`  
检查 MCP 配置和运行态。

`mcp repair --server <id>`  
修复配置或状态。

`mcp restart --server <id>`  
重启 MCP 服务。

## 6. 三组命令的统一风格

第二阶段这三组命令建议统一遵守：

```text
list      列表
inspect   详情
doctor    健康检查
repair    修复
enable    启用
disable   禁用
```

然后再按对象特性补：

```text
platforms  detect / capabilities / resolve
skills     install / uninstall
mcp        add / remove / restart
```

## 7. Desktop 对应动作

Desktop 页面动作应和 CLI 命令一一对应。

### Platforms 页面

对应：

```text
list
inspect
detect
doctor
capabilities
resolve
```

### Skills 页面

对应：

```text
list
inspect
install
uninstall
enable
disable
doctor
repair
```

### MCP 页面

对应：

```text
list
inspect
add
remove
enable
disable
doctor
repair
restart
```

## 8. Runtime 命令映射

建议 Runtime 内部继续走统一命令对象，而不是让三组命令各自乱长。

例如：

```text
platform.list
platform.inspect
platform.detect
platform.resolve

skill.list
skill.inspect
skill.install
skill.repair

mcp.list
mcp.inspect
mcp.restart
mcp.repair
```

这样：

- Desktop 可以直接映射按钮动作
- CLI 可以直接映射命令动作
- Runtime 可以稳定做 handler 分发

## 9. 第一批实现优先级

第二阶段第一批建议先做：

```text
platforms list
platforms inspect
platforms detect
platforms doctor

skills list
skills inspect
skills doctor
skills repair

mcp list
mcp inspect
mcp doctor
mcp repair
```

先把“可见、可查、可修”做起来。

第二批再补：

```text
skills install / uninstall / enable / disable
mcp add / remove / enable / disable / restart
platforms capabilities / resolve
```

## 10. 审核点

你审核这份文档时，重点看：

```text
1  是否接受 platforms / skills / mcp 三组正式命令族
2  是否接受三组命令共享统一动作风格
3  是否接受 Desktop 页面动作与 CLI 子命令一一对应
4  是否接受第二阶段第一批先做 list / inspect / doctor / repair
```
