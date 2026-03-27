# FoxPilot 第二阶段桌面读模型契约

## 1. 文档目的

这份文档只定义一件事：

> 桌面端页面应该消费什么读模型，而不是直接消费 Runtime 原始实体或 SQLite 表结构。

第二阶段桌面端如果直接拿：

- 原始 `task` 行
- 原始 `task_run` 行
- 原始 Skills 目录结果
- 原始 MCP 配置结果

页面会很快变成一堆前端拼装逻辑。

所以必须先定义：

> 桌面端页面消费的是“读模型”，不是“底层行数据”。

## 2. 读模型定位

读模型是：

```text
给 Desktop 页面直接渲染的数据视图
```

它由 `Runtime Core` 内的 `read-models` 层统一提供，并通过 `Desktop Bridge` 返回给前端。

读模型不负责：

- 写操作
- 状态流转决策
- 平台探测
- Skill / MCP 修复

## 3. 页面与读模型对应关系

第二阶段第一批页面建议对应：

```text
Dashboard            -> DashboardReadModel
Tasks                -> TaskListReadModel / TaskDetailReadModel
Runs                 -> RunDetailReadModel
Events               -> EventTimelineReadModel
Control Plane        -> ControlPlaneOverviewReadModel
Platforms            -> PlatformListReadModel / PlatformDetailReadModel
Skills               -> SkillListReadModel / SkillDetailReadModel
MCP                  -> MCPListReadModel / MCPDetailReadModel
Settings / Health    -> HealthReadModel
Project Init Wizard  -> InitWizardReadModel
```

## 4. 总体规则

### 4.1 页面只拿自己需要的聚合结果

例如：

- `Tasks` 页不自己拼 `stage / role / platform`
- `Control Plane` 不自己汇总 `ready / degraded / unavailable`
- `Init Wizard` 不自己拼平台候选与原因

这些都应由 Runtime 读模型提前组织好。

### 4.2 右侧面板也要有正式读模型

不要让右侧面板直接吃主列表对象的原始字段，而要给：

```text
PlatformDetailReadModel
SkillDetailReadModel
MCPDetailReadModel
TaskDetailReadModel
```

### 4.3 列表模型与详情模型分开

因为列表关注的是“可扫描性”，详情关注的是“可解释性”。

## 5. DashboardReadModel

建议至少包含：

```ts
interface DashboardReadModel {
  projectCount: number
  repositoryCount: number
  activeTaskCount: number
  blockedTaskCount: number
  recentRunCount: number
  controlPlaneSummary: {
    platformCount: number
    skillCount: number
    mcpCount: number
    degradedCount: number
    unavailableCount: number
  }
  highlights: DashboardHighlight[]
}
```

## 6. Task 读模型

### 6.1 TaskListReadModel

```ts
interface TaskListItemReadModel {
  taskId: string
  title: string
  source: 'local' | 'beads'
  status: string
  priority: string
  stage: string | null
  role: string | null
  platform: string | null
  repository: string | null
  updatedAt: string
}
```

### 6.2 TaskDetailReadModel

```ts
interface TaskDetailReadModel {
  task: TaskListItemReadModel
  description: string | null
  targets: TaskTargetReadModel[]
  orchestration: {
    stage: string | null
    role: string | null
    platform: string | null
    platformSource: string | null
  }
  recentRuns: RunSummaryReadModel[]
}
```

## 7. RunDetailReadModel

建议至少包含：

```ts
interface RunDetailReadModel {
  runId: string
  taskId: string
  stage: string
  role: string
  platform: string
  status: string
  startedAt: string | null
  finishedAt: string | null
  summary: string | null
  changedFiles: string[]
  tests: string[]
  artifacts: string[]
  errorDetail: string | null
  nextSuggestion: string | null
}
```

## 8. Control Plane 读模型

### 8.1 ControlPlaneOverviewReadModel

```ts
interface ControlPlaneOverviewReadModel {
  summary: {
    platformCount: number
    skillCount: number
    mcpCount: number
    readyCount: number
    degradedCount: number
    unavailableCount: number
  }
  recentChecks: {
    platformDetectAt: string | null
    platformDoctorAt: string | null
    skillDoctorAt: string | null
    mcpDoctorAt: string | null
  }
  highlights: ControlPlaneHighlight[]
}
```

### 8.2 PlatformListReadModel / Detail

列表项：

```ts
interface PlatformListItemReadModel {
  platformId: string
  name: string
  status: string
  version: string | null
  supportedStages: string[]
  recommendedRoles: string[]
  lastCheckedAt: string | null
}
```

详情项：

```ts
interface PlatformDetailReadModel {
  platformId: string
  name: string
  status: string
  version: string | null
  capabilities: string[]
  supportedStages: string[]
  recommendedRoles: string[]
  detectReasons: string[]
  availableActions: string[]
  healthSummary: string | null
  lastCheckedAt: string | null
}
```

### 8.3 SkillListReadModel / Detail

列表项：

```ts
interface SkillListItemReadModel {
  skillId: string
  name: string
  status: string
  enabled: boolean
  version: string | null
  source: string
  lastCheckedAt: string | null
}
```

详情项：

```ts
interface SkillDetailReadModel {
  skillId: string
  name: string
  status: string
  enabled: boolean
  version: string | null
  source: string
  installPath: string | null
  manifestPath: string | null
  healthSummary: string | null
  availableActions: string[]
}
```

### 8.4 MCPListReadModel / Detail

列表项：

```ts
interface MCPListItemReadModel {
  serverId: string
  name: string
  status: string
  enabled: boolean
  command: string | null
  lastCheckedAt: string | null
}
```

详情项：

```ts
interface MCPDetailReadModel {
  serverId: string
  name: string
  status: string
  enabled: boolean
  command: string | null
  args: string[]
  configPath: string | null
  healthSummary: string | null
  recentError: string | null
  availableActions: string[]
}
```

## 9. InitWizardReadModel

初始化向导不应该自己拼扫描结果和平台解析结果。

建议给一个完整读模型：

```ts
interface InitWizardReadModel {
  projectPath: string
  projectType: string
  repositories: InitRepositoryReadModel[]
  profileOptions: ProfileOptionReadModel[]
  selectedProfile: string
  orchestration: ProjectOrchestrationSnapshot
  summary: {
    enabledCapabilities: string[]
    detectedPlatforms: string[]
    blockingIssues: string[]
  }
}
```

## 10. 刷新语义

桌面端读模型必须允许按区域刷新，而不是每次全量重拉。

建议第一批支持：

```text
dashboard
tasks
runs
controlPlane
health
projectInit
```

也就是 `Desktop Bridge` 返回的 `refreshHints`，应直接映射到这些读模型区域。

## 11. 为什么 Desktop 不正式走 CLI JSON

因为第二阶段已经明确：

```text
CLI --json = 脚本化接口
Desktop    = Runtime 正式桥接
```

所以桌面端读模型和 CLI JSON 可以相似，但不能完全等同。

区别是：

- CLI JSON 更偏命令结果
- Desktop 读模型更偏页面聚合结果

## 12. 审核点

你审核这份契约时，重点看：

```text
1  是否接受页面只消费读模型，不消费底层行数据
2  是否接受列表模型与详情模型分开
3  是否接受 Control Plane Overview / Platforms / Skills / MCP 都有正式读模型
4  是否接受 Desktop 读模型与 CLI JSON 契约相近但不等同
```
