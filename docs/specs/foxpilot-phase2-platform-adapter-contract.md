# FoxPilot 第二阶段平台适配器契约

## 1. 文档目的

这份文档只定义一件事：

> `Codex / Claude Code / Qoder / Trae / Future` 这些平台，接入 FoxPilot 时必须遵守什么统一契约。

如果没有这份契约，后面每接一个平台都会把：

- Runtime Core
- init
- run
- health
- UI

一起拖着改。

## 2. 契约目标

平台适配器契约必须解决：

```text
如何探测
如何健康检查
如何准备上下文
如何运行某个阶段
如何回收结果
如何取消执行
```

并且这些动作要对 Runtime Core 看起来统一。

## 3. 平台适配器统一接口

建议契约至少包含：

```ts
type PlatformId =
  | 'codex'
  | 'claude_code'
  | 'qoder'
  | 'trae'
  | 'manual'
  | 'future'

type StageId =
  | 'analysis'
  | 'design'
  | 'implement'
  | 'verify'
  | 'repair'
  | 'review'

type RoleId =
  | 'designer'
  | 'coder'
  | 'tester'
  | 'fixer'
  | 'reviewer'

interface ExecutionPlatformAdapter {
  platformId: PlatformId
  detect(input: DetectPlatformInput): Promise<PlatformDetectResult>
  doctor(input: PlatformDoctorInput): Promise<PlatformDoctorResult>
  prepareContext(input: PrepareContextInput): Promise<PreparedContextResult>
  runStage(input: RunStageInput): Promise<RunStageResult>
  readResult(input: ReadPlatformResultInput): Promise<ReadPlatformResult>
  cancelRun(input: CancelPlatformRunInput): Promise<CancelPlatformRunResult>
}
```

## 4. 每个方法的职责

### 4.1 `detect()`

负责：

- 探测平台是否存在
- 探测平台版本
- 探测平台声明能力
- 返回健康状态和基础原因

不负责：

- 决定这个平台是否最终被选中

那是 `Platform Resolver` 的职责。

### 4.2 `doctor()`

负责：

- 更深入的健康检查
- 发现配置不完整、权限异常、环境变量问题
- 返回修复建议

### 4.3 `prepareContext()`

负责：

- 把 Runtime Core 给出的上下文打包成平台能消费的形式
- 生成中间文件、任务描述、上下文目录或结构化输入

这一步是为了保证 Runtime Core 不关心平台具体吃什么格式。

### 4.4 `runStage()`

负责：

- 在某个平台上执行某个阶段
- 返回启动结果、运行标识、初始状态

它只负责“发起运行”，不负责最终状态落地。

### 4.5 `readResult()`

负责：

- 回收运行结果
- 读取摘要、日志、产物、错误
- 返回统一结构

### 4.6 `cancelRun()`

负责：

- 请求取消某次运行
- 返回取消结果

## 5. 输入输出模型

### 5.1 探测输入

```ts
interface DetectPlatformInput {
  workspacePath: string
  repositoryPaths: string[]
  environment: Record<string, string | undefined>
}
```

### 5.2 探测结果

```ts
interface PlatformDetectResult {
  platformId: PlatformId
  status: 'ready' | 'degraded' | 'unavailable'
  version: string | null
  capabilities: PlatformCapability[]
  reasons: string[]
}
```

### 5.3 平台能力

平台能力不要直接写成“这个平台能不能做所有事”，而要结构化：

```ts
type PlatformCapability =
  | 'analysis'
  | 'design'
  | 'implement'
  | 'verify'
  | 'repair'
  | 'review'
  | 'docs'
```

### 5.4 运行输入

```ts
interface RunStageInput {
  runId: string
  taskId: string
  stage: StageId
  role: RoleId
  platformId: PlatformId
  workspacePath: string
  repositoryPath: string | null
  contextPath: string | null
  expectedOutput: string[]
  constraints: string[]
}
```

### 5.5 运行结果

```ts
interface RunStageResult {
  accepted: boolean
  externalRunId: string | null
  status: 'queued' | 'running' | 'failed_to_start'
  reasons: string[]
}
```

### 5.6 结果回收

```ts
interface ReadPlatformResult {
  status: 'running' | 'success' | 'failed' | 'blocked' | 'cancelled'
  summary: string | null
  changedFiles: string[]
  tests: string[]
  artifacts: string[]
  errorDetail: string | null
  nextSuggestion: string | null
}
```

## 6. 平台选择不是平台适配器职责

必须明确：

```text
平台适配器只返回能力和执行结果
平台选择属于 Runtime Core 的 Platform Resolver
```

也就是说：

- `Codex Adapter` 不能自己决定“设计阶段必须用我”
- `Claude Code Adapter` 不能自己决定“编码阶段必须用我”

这些都必须由 `Platform Resolver` 根据：

- stage
- role
- detected platforms
- project rule
- user override

统一决策。

## 7. 错误模型

平台适配器统一错误码建议至少包含：

```text
PLATFORM_NOT_INSTALLED
PLATFORM_NOT_CONFIGURED
PLATFORM_COMMAND_FAILED
PLATFORM_STATE_INVALID
PLATFORM_PERMISSION_DENIED
PLATFORM_CAPABILITY_MISMATCH
PLATFORM_RESULT_UNREADABLE
```

所有平台都要复用这套错误模型，不要各自发明。

## 8. 最小适配器实现要求

第二阶段第一批即使只真正实现一个平台，也必须把其余平台按“空实现 / 预留实现”纳入目录与契约。

建议：

```text
Codex          第一批可做最小实现
Claude Code    第二批接入
Qoder          第二批接入
Trae           第二批接入
```

这样目录和契约先稳定，后面不会再改 Runtime Core。

## 9. UI 与 CLI 如何消费这份契约

Desktop 和 CLI 都不直接调平台。

正确路径是：

```text
Desktop / CLI
-> Runtime Core
-> Platform Resolver
-> Execution Platform Adapter
```

Desktop 看到的是：

- 当前平台健康状态
- 当前阶段推荐平台
- 当前运行在哪个平台执行

CLI `--json` 看到的是：

- 平台探测结果
- 平台解析结果
- 运行结果

## 10. 审核点

你审核这份契约时，重点看：

```text
1  是否接受所有平台共用一套适配器接口
2  是否接受平台适配器不负责平台选择
3  是否接受能力按 stage/role/capability 结构化表达
4  是否接受 Codex / Claude Code / Qoder / Trae 统一接入
```
