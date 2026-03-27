# FoxPilot 第二阶段中控注册表模型

## 1. 文档目的

这份文档只定义一件事：

> FoxPilot 第二阶段如何用统一注册表模型管理 Platforms / Skills / MCP。

没有这层注册表，后面会出现：

- Platforms 页面有自己的数据结构
- Skills 页面有另一套结构
- MCP 页面再有第三套结构
- CLI 命令和 UI 页面对不上

## 2. 注册表定位

第二阶段中控注册表不是新的数据库真相源，而是：

> Runtime Core 聚合后的统一管理视图

它的作用是把不同来源的对象收敛成统一管理模型，方便：

- Desktop 渲染
- CLI `--json`
- 健康检查
- doctor / repair

## 3. 注册表总结构

建议中控注册表分三类：

```text
platformRegistry
skillRegistry
mcpRegistry
```

它们共享一套基础元信息。

## 4. 通用基础结构

建议每个注册项至少共享这些字段：

```ts
interface ControlPlaneRegistryItem {
  id: string
  kind: 'platform' | 'skill' | 'mcp'
  name: string
  source: string
  status: 'ready' | 'degraded' | 'unavailable'
  healthSummary: string | null
  lastCheckedAt: string | null
  availableActions: string[]
}
```

这一层的目标是让 UI 和 CLI 可以先统一拿到：

- 是谁
- 属于哪类
- 现在是否健康
- 可以做什么动作

## 5. Platform Registry

### 5.1 平台注册项

```ts
interface PlatformRegistryItem extends ControlPlaneRegistryItem {
  kind: 'platform'
  platformId: 'codex' | 'claude_code' | 'qoder' | 'trae' | 'future'
  version: string | null
  capabilities: string[]
  supportedStages: string[]
  recommendedRoles: string[]
  detectReasons: string[]
}
```

### 5.2 作用

平台注册表用于：

- Platforms 页面
- 平台健康页
- 平台解析结果预览
- 项目初始化里的平台解析摘要

## 6. Skill Registry

### 6.1 技能注册项

```ts
interface SkillRegistryItem extends ControlPlaneRegistryItem {
  kind: 'skill'
  skillId: string
  version: string | null
  installPath: string | null
  manifestPath: string | null
  enabled: boolean
}
```

### 6.2 作用

技能注册表用于：

- Skills 页面
- skills list / inspect
- skills doctor / repair

## 7. MCP Registry

### 7.1 MCP 注册项

```ts
interface MCPRegistryItem extends ControlPlaneRegistryItem {
  kind: 'mcp'
  serverId: string
  configPath: string | null
  command: string | null
  args: string[]
  enabled: boolean
}
```

### 7.2 作用

MCP 注册表用于：

- MCP 页面
- mcp list / inspect
- mcp doctor / repair / restart

## 8. 统一动作映射

注册表里的 `availableActions` 不应该是任意字符串拼接，而应该来自统一动作集。

建议：

```text
inspect
doctor
repair
enable
disable
install
uninstall
add
remove
restart
detect
capabilities
resolve
```

然后按对象类型限制可用动作。

## 9. 统一聚合入口

Runtime Core 里建议有一个统一聚合入口，例如：

```text
Control Plane Read Model Service
```

它负责：

- 聚合平台注册表
- 聚合技能注册表
- 聚合 MCP 注册表
- 输出桌面端和 CLI 可直接消费的读模型

这样：

- UI 不需要自己拼数据
- CLI `--json` 不需要自己拼数据
- 逻辑集中

## 10. 真相源边界

### 10.1 Platform

平台的真相源来自：

- 平台探测结果
- 平台 doctor 结果
- 本地命令 / 进程状态

### 10.2 Skill

技能的真相源来自：

- 技能目录
- 技能元数据
- manifest / `SKILL.md`

### 10.3 MCP

MCP 的真相源来自：

- MCP 配置文件
- 进程状态
- doctor 检查结果

### 10.4 注册表不是最终真相源

注册表只是聚合视图，不应该替代这些对象自己的真实来源。

## 11. 页面如何消费注册表

### 11.1 Control Plane 总览

可以直接基于注册表输出：

```text
平台数量
skills 数量
mcp 数量
degraded 数量
unavailable 数量
```

### 11.2 子页面

各子页面直接拿各自的注册项数组渲染表格和详情。

## 12. 审核点

你审核这份模型时，重点看：

```text
1  是否接受 Platforms / Skills / MCP 共用一套基础注册项结构
2  是否接受注册表只是聚合视图，不是最终真相源
3  是否接受 Runtime Core 增加 Control Plane Read Model Service
4  是否接受 UI 和 CLI 都从注册表读模型消费，而不是各自拼装
```
