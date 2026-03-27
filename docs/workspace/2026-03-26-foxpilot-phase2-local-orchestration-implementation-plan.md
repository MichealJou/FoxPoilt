# FoxPilot Phase 2 Local Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在第一阶段本地 CLI 已完成的前提下，实现第二阶段的三条主线：安装阶段基础组合接管、桌面优先的本地协作控制台骨架，以及面向多平台的共享编排核心。

**Architecture:** 第二阶段实现采用 `Desktop / CLI 双入口 + Shared Runtime`。主线 A 负责系统级和项目级接管，包括 Foundation Pack、项目 profile 和 `init` 流程增强；主线 B 负责桌面控制台外壳和首批页面骨架；主线 C 负责把当前 CLI 业务能力下沉为共享 Runtime，并引入 `Stage / Role / Platform` 三层编排模型。三条主线共享项目、仓库、任务、运行和环境健康这套读模型。

**Tech Stack:** `TypeScript`、`Node.js`、`pnpm`、`Vitest`、`Tauri`、`React`、`Vite`、`shadcn/ui`

**Reference Docs:**
- `docs/specs/foxpilot-phase2-tool-architecture.md`
- `docs/specs/foxpilot-phase2-runtime-core-architecture.md`
- `docs/specs/foxpilot-phase2-integrations-architecture.md`
- `docs/specs/foxpilot-phase2-runtime-directory-structure.md`
- `docs/specs/foxpilot-phase2-platform-adapter-contract.md`
- `docs/specs/foxpilot-phase2-skills-mcp-management-model.md`
- `docs/specs/foxpilot-phase2-agent-control-plane-spec.md`
- `docs/specs/foxpilot-phase2-control-plane-information-architecture.md`
- `docs/specs/foxpilot-phase2-control-plane-commands.md`
- `docs/specs/foxpilot-phase2-control-plane-registry-model.md`
- `docs/specs/foxpilot-phase2-runtime-command-model.md`
- `docs/specs/foxpilot-phase2-control-plane-action-protocol.md`
- `docs/specs/foxpilot-phase2-control-plane-json-contract.md`
- `docs/specs/foxpilot-phase2-platform-resolution-model.md`
- `docs/specs/foxpilot-phase2-desktop-bridge-contract.md`
- `docs/specs/foxpilot-phase2-desktop-read-model-contract.md`
- `docs/specs/foxpilot-phase2-init-wizard-state-machine.md`
- `docs/specs/foxpilot-phase2-page-data-contracts.md`
- `docs/specs/foxpilot-phase2-control-plane-registry-event-model.md`
- `docs/specs/foxpilot-phase2-runtime-query-surface.md`
- `docs/specs/foxpilot-phase2-control-plane-page-action-matrix.md`
- `docs/specs/foxpilot-phase2-read-model-refresh-policy.md`
- `docs/specs/foxpilot-phase2-runtime-mutation-surface.md`
- `docs/specs/foxpilot-phase2-risk-confirmation-policy.md`
- `docs/specs/foxpilot-phase2-stage-role-platform-handoff-model.md`
- `docs/specs/foxpilot-phase2-platform-capability-matrix.md`
- `docs/specs/foxpilot-phase2-workflow-template-model.md`
- `docs/specs/foxpilot-phase2-skills-mcp-binding-model.md`
- `docs/specs/foxpilot-phase2-handoff-artifact-catalog.md`
- `docs/specs/foxpilot-phase2-override-precedence-policy.md`
- `docs/specs/foxpilot-phase2-execution-session-lifecycle.md`
- `docs/specs/foxpilot-phase2-runtime-persistence-model.md`
- `docs/specs/foxpilot-phase2-runtime-event-taxonomy.md`
- `docs/specs/foxpilot-phase2-project-config-schema.md`
- `docs/specs/foxpilot-phase2-project-scan-signal-model.md`
- `docs/specs/foxpilot-phase2-init-recommendation-engine.md`
- `docs/specs/foxpilot-phase2-doctor-repair-decision-matrix.md`
- `docs/specs/foxpilot-phase2-dashboard-aggregation-model.md`
- `docs/specs/foxpilot-phase2-task-run-detail-action-model.md`
- `docs/specs/foxpilot-phase2-control-plane-bulk-action-policy.md`

---

## 文件结构

本计划默认在现有仓库内继续扩展，但逻辑上拆成双入口和共享核心。

### 现有目录复用

- `src/commands/init`
  - 继续承接 `init` 命令
- `src/install`
  - 继续承接安装、更新、卸载、安装元数据
- `src/project`
  - 继续承接项目与仓库识别
- `src/config`
  - 继续承接全局配置与项目配置
- `src/db`
  - 继续承接 SQLite 持久化与读写
- `src/commands`
  - 逐步从 CLI 入口侧剥离共享业务逻辑

### 新增目录建议

- `src/foundation`
  - Foundation Pack 检测、安装、配置、校验
- `src/runtime`
  - 共享业务核心，统一承接 Desktop 与 CLI
- `src/runtime/services`
  - Foundation / Init / Task / Run / Event 等运行时服务
- `src/runtime/orchestrators`
  - Stage / Role / Platform 编排器
- `src/runtime/read-models`
  - Control Plane / Dashboard / Tasks / Runs 读模型聚合
- `src/integrations`
  - 协作集成层与执行平台集成层
- `src/platforms`
  - `Codex / Claude Code / Qoder / Trae / Future` 统一平台适配层
- `src/contracts`
  - Desktop、CLI、Runtime 之间的结构化契约
- `src/desktop`
  - 桌面端专属入口与桥接
- `src/ui`
  - 桌面控制台前端入口与页面
- `src/ui/app`
  - 应用骨架、路由、布局
- `src/ui/pages/dashboard`
  - 总览页
- `src/ui/pages/projects`
  - 项目与仓库页
- `src/ui/pages/tasks`
  - 任务中心页
- `src/ui/pages/runs`
  - 运行详情页
- `src/ui/pages/events`
  - 事件时间线页
- `src/ui/pages/settings`
  - 设置与健康页
- `src/ui/pages/init-wizard`
  - 项目初始化向导
- `src/ui/components`
  - 表格、状态标签、侧边面板、统计卡片等
- `src/ui/state`
  - 前端只读状态组合层
- `src/ui/theme`
  - 颜色、字体、间距、状态标签定义
- `src-tauri`
  - Tauri 桌面壳、窗口配置与命令桥

### 关键新增文件建议

- `src/foundation/foundation-profile.ts`
  - Foundation Pack 定义与元数据
- `src/foundation/foundation-installer.ts`
  - 基础组合安装编排
- `src/foundation/foundation-doctor.ts`
  - 安装后校验与健康检查
- `src/commands/system/system-foundation-command.ts`
  - 查看或修复基础组合状态
- `src/commands/init/init-profile.ts`
  - 项目 profile 定义
- `src/project/project-orchestration-config.ts`
  - 项目级协作配置结构，拆分 profile 与阶段 / 角色 / 平台 快照
- `src/runtime/orchestrators/stage-orchestrator.ts`
  - 阶段定义与阶段推进规则
- `src/runtime/orchestrators/role-orchestrator.ts`
  - 阶段到角色的映射与交接
- `src/runtime/orchestrators/platform-resolver.ts`
  - 平台推荐值、显式覆盖值和最终生效值的统一结构
- `src/runtime/orchestrators/stage-handoff-orchestrator.ts`
  - 阶段推进、交接包生成与下一阶段落地
- `src/runtime/workflows/workflow-template-registry.ts`
  - 工作流模板注册、匹配与默认链定义
- `src/runtime/bindings/skill-mcp-binding-resolver.ts`
  - Skills / MCP 正式绑定解析
- `src/platforms/platform-capability-matrix.ts`
  - 平台能力矩阵定义
- `src/runtime/artifacts/handoff-artifact-catalog.ts`
  - 交接产物目录与类型词表
- `src/runtime/overrides/override-precedence-policy.ts`
  - 覆盖来源统一裁决规则
- `src/runtime/sessions/execution-session-service.ts`
  - 平台执行会话生命周期管理
- `src/runtime/events/runtime-event-taxonomy.ts`
  - Runtime 正式事件分类与事件类型注册
- `src/runtime/persistence/runtime-persistence-model.ts`
  - 配置层、历史层与派生读模型分层规则
- `src/project/project-config-schema.ts`
  - 第二阶段 project.json 结构
- `src/project/project-scan-signal-collector.ts`
  - 项目扫描信号采集器
- `src/runtime/recommendation/init-recommendation-engine.ts`
  - init.preview 推荐引擎
- `src/runtime/health/doctor-repair-decision-matrix.ts`
  - doctor / repair 正式决策矩阵
- `src/runtime/read-models/dashboard-aggregation-service.ts`
  - Dashboard 首页聚合服务
- `src/runtime/actions/task-run-detail-action-service.ts`
  - Tasks / Runs 详情动作服务
- `src/runtime/actions/control-plane-bulk-action-policy.ts`
  - Control Plane 批量动作策略
- `src/runtime/mutations/runtime-mutation-surface.ts`
  - Runtime 正式写接口与结果结构
- `src/runtime/confirmation/risk-confirmation-policy.ts`
  - 高风险动作确认规则
- `src/platforms/platform-contract.ts`
  - 多平台统一适配器契约
- `src/platforms/codex-adapter.ts`
  - `Codex` 平台适配
- `src/platforms/claude-code-adapter.ts`
  - `Claude Code` 平台适配预留
- `src/platforms/qoder-adapter.ts`
  - `Qoder` 平台适配预留
- `src/platforms/trae-adapter.ts`
  - `Trae` 平台适配预留
- `src/runtime/read-models/control-plane-read-model.ts`
  - Platforms / Skills / MCP 统一中控读模型
- `src/contracts/runtime-contract.ts`
  - Desktop / CLI / Runtime 之间的结构化契约
- `src/cli/json-output.ts`
  - CLI 脚本化输出帮助函数
- `src/ui/main.tsx`
  - UI 入口
- `src/desktop/bridge/runtime-bridge.ts`
  - Tauri 侧 Runtime 调用适配
- `src/ui/app/router.tsx`
  - 页面路由
- `src/ui/app/layout.tsx`
  - 应用布局
- `src/ui/app/navigation.tsx`
  - 左侧导航
- `src/ui/pages/init-wizard/project-init-wizard-page.tsx`
  - 项目初始化向导主页面
- `src/ui/pages/tasks/tasks-page.tsx`
  - 任务中心页
- `src/ui/pages/runs/run-detail-page.tsx`
  - 运行详情页
- `src/ui/pages/dashboard/dashboard-page.tsx`
  - 总览页
- `src/ui/state/read-model.ts`
  - 把现有 SQLite 数据拼成 UI 读模型
- `tests/foundation/foundation-installer.test.ts`
  - 基础组合安装测试
- `tests/foundation/foundation-doctor.test.ts`
  - 基础组合 doctor / repair / 回滚测试
- `tests/cli/system-foundation-command.test.ts`
  - 基础组合命令测试
- `tests/runtime/platform-resolver.test.ts`
  - 平台解析测试
- `tests/runtime/stage-role-orchestrator.test.ts`
  - 阶段 / 角色 编排测试
- `tests/runtime/stage-handoff-orchestrator.test.ts`
  - 阶段交接与 handoff 测试
- `tests/runtime/workflow-template-registry.test.ts`
  - 工作流模板匹配与阶段链测试
- `tests/runtime/skill-mcp-binding-resolver.test.ts`
  - Skills / MCP 正式绑定解析测试
- `tests/platforms/platform-capability-matrix.test.ts`
  - 平台能力矩阵测试
- `tests/runtime/handoff-artifact-catalog.test.ts`
  - 交接产物目录测试
- `tests/runtime/override-precedence-policy.test.ts`
  - 覆盖优先级测试
- `tests/runtime/execution-session-service.test.ts`
  - 执行会话生命周期测试
- `tests/runtime/runtime-event-taxonomy.test.ts`
  - Runtime 正式事件分类测试
- `tests/runtime/runtime-persistence-model.test.ts`
  - 持久化分层模型测试
- `tests/project/project-config-schema.test.ts`
  - 第二阶段项目配置结构测试
- `tests/project/project-scan-signal-collector.test.ts`
  - 项目扫描信号采集测试
- `tests/runtime/init-recommendation-engine.test.ts`
  - init 推荐引擎测试
- `tests/runtime/doctor-repair-decision-matrix.test.ts`
  - doctor / repair 决策矩阵测试
- `tests/runtime/dashboard-aggregation-service.test.ts`
  - Dashboard 聚合模型测试
- `tests/runtime/task-run-detail-action-service.test.ts`
  - Tasks / Runs 详情动作测试
- `tests/runtime/control-plane-bulk-action-policy.test.ts`
  - Control Plane 批量动作策略测试
- `tests/runtime/runtime-mutation-surface.test.ts`
  - Runtime 正式写接口测试
- `tests/runtime/risk-confirmation-policy.test.ts`
  - 高风险动作确认测试
- `tests/platforms/platform-contract.test.ts`
  - 多平台契约测试
- `tests/runtime/control-plane-read-model.test.ts`
  - 中控注册表与中控读模型测试
- `tests/contracts/runtime-contract.test.ts`
  - 共享契约测试
- `tests/cli/json-output.test.ts`
  - CLI 脚本化输出测试
- `tests/desktop/runtime-bridge.test.ts`
  - 桌面端 Runtime 桥测试
- `tests/cli/init-command-phase2.test.ts`
  - 第二阶段 `init` 行为测试
- `tests/ui/*.test.tsx`
  - 前端页面和状态组件测试

## 实现原则

- 第二阶段仍然以本地优先为原则
- 不依赖 Codex Desktop 私有控制接口
- Foundation Pack 和项目 profile 必须分层
- UI 先承接读能力和初始化向导，不一开始补全全部写操作
- 桌面端固定通过 `Tauri` 承载，不新增独立 Web 仓库
- Desktop 与 CLI 必须分成两个独立入口
- Runtime Core 必须成为唯一业务核心
- Skills / MCP 必须进入正式集成层，不挂在 UI 临时逻辑里
- `CLI --json` 只承担脚本化与调试接口，不承担桌面端正式主通道
- 阶段 / 角色 / 平台 必须拆开，不能再把平台当单一执行器
- 执行平台集成必须按统一契约接入，避免后续接入 Claude Code / Qoder / Trae 时返工
- 桌面端必须按“中控平台”设计，不只停留在任务面板
- 所有正式写动作必须先进入 Runtime Mutation Surface
- 高风险动作必须统一走 Risk Confirmation Policy
- 阶段推进必须形成 handoff，而不是只改任务字段
- Workflow Template 必须作为 Profile 与 Snapshot 之间的正式层
- Platform Capability Matrix 必须作为 Detect 与 Resolve 之间的正式层
- Skills / MCP 必须从清单管理升级为正式绑定模型
- Artifact Catalog 必须成为 handoff 与平台消费的统一词表
- Override Precedence Policy 必须保证推荐值与生效值可解释
- Execution Session 必须把平台执行过程从 Run 里独立出来
- Runtime Persistence Model 必须明确哪些东西进 SQLite、哪些东西进 project.json
- Runtime Event Taxonomy 必须统一 init / task / run / handoff / session / control plane 事件
- 第二阶段 project.json 必须从最小配置升级为正式 orchestration 输入结构
- Project Scan Signals 必须成为 template / recommendation / doctor 的共同输入
- Init Recommendation Engine 必须先于 preview 结果生成
- Doctor / Repair Decision Matrix 必须统一 auto / suggest / manual 与确认级别
- Dashboard Aggregation Model 必须统一首页聚合逻辑与 Focus Queue
- Task / Run Detail Action Model 必须限制详情页动作边界
- Control Plane Bulk Action Policy 必须防止首页批量写动作失控
- 保持 TDD：先写失败测试，再补最小实现

### Task 0: 双入口与 Shared Runtime 基线

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `vitest.config.ts`
- Create: `src/contracts/runtime-contract.ts`
- Create: `src/runtime/index.ts`
- Create: `src/cli/json-output.ts`
- Create: `src/desktop/bridge/runtime-bridge.ts`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/tauri.conf.json`
- Test: `tests/contracts/runtime-contract.test.ts`
- Test: `tests/cli/json-output.test.ts`
- Test: `tests/desktop/runtime-bridge.test.ts`

- [ ] **Step 1: 写失败测试，约束 Desktop / CLI 共用 Runtime 契约**

```ts
it('defines a shared runtime command contract', async () => {
  const { createRuntimeCommand } = await import('@/contracts/runtime-contract.js')
  expect(createRuntimeCommand('task.list').name).toBe('task.list')
})

it('builds a desktop runtime bridge request', async () => {
  const { buildRuntimeBridgeRequest } = await import('@/desktop/bridge/runtime-bridge.js')
  expect(buildRuntimeBridgeRequest('task.list').name).toBe('task.list')
})

it('serializes runtime result for cli json mode', async () => {
  const { toJsonOutput } = await import('@/cli/json-output.js')
  expect(toJsonOutput({ ok: true })).toContain('\"ok\": true')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/contracts/runtime-contract.test.ts tests/desktop/runtime-bridge.test.ts tests/cli/json-output.test.ts`
Expected: FAIL，因为当前还没有共享 Runtime 契约、桌面桥和 CLI JSON 辅助层。

- [ ] **Step 3: 建立最小 Shared Runtime 基线**

```ts
export function createRuntimeCommand(name: string) {
  return { name }
}
```

```ts
export function buildRuntimeBridgeRequest(name: string) {
  return { name }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/contracts/runtime-contract.test.ts tests/desktop/runtime-bridge.test.ts tests/cli/json-output.test.ts`
Expected: PASS

- [ ] **Step 5: 提交 Shared Runtime 基线**

```bash
git add package.json tsconfig.json vitest.config.ts src/contracts/runtime-contract.ts src/runtime/index.ts src/desktop/bridge/runtime-bridge.ts src/cli/json-output.ts src-tauri tests/contracts/runtime-contract.test.ts tests/desktop/runtime-bridge.test.ts tests/cli/json-output.test.ts
git commit -m "feat: add shared runtime baseline"
```

### Task 1: Foundation Pack 定义与系统级安装状态

**Files:**
- Create: `src/foundation/foundation-profile.ts`
- Create: `src/foundation/foundation-installer.ts`
- Create: `src/foundation/foundation-doctor.ts`
- Create: `src/commands/system/system-foundation-command.ts`
- Modify: `src/install/install-types.ts`
- Modify: `src/install/install-manifest.ts`
- Test: `tests/foundation/foundation-installer.test.ts`
- Test: `tests/foundation/foundation-doctor.test.ts`
- Test: `tests/cli/system-foundation-command.test.ts`

- [ ] **Step 1: 写 Foundation Pack 的失败测试**

```ts
it('returns the default foundation pack with beads and superpowers', async () => {
  const { getDefaultFoundationPack } = await import('@/foundation/foundation-profile.js')
  expect(getDefaultFoundationPack().items).toEqual(['beads', 'superpowers'])
})

it('marks missing tools as installable units', async () => {
  const result = await ensureFoundationPack({
    detectTool: async (tool) => tool === 'beads' ? null : { version: '1.0.0' },
  })
  expect(result.missing).toContain('beads')
  expect(result.ready).toContain('superpowers')
})

it('reports doctor result for missing and ready tools', async () => {
  const result = await runFoundationDoctor({
    detectTool: async (tool) => tool === 'beads' ? null : { version: '1.0.0' },
  })
  expect(result.items[0].status).toBeDefined()
})

it('prints foundation command usage', async () => {
  const cli = await runCli(['foundation', '--help'])
  expect(cli.stdout).toContain('foxpilot foundation')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/foundation/foundation-installer.test.ts tests/foundation/foundation-doctor.test.ts tests/cli/system-foundation-command.test.ts`
Expected: FAIL，因为 `foundation` 目录和基础组合命令尚不存在。

- [ ] **Step 3: 写最小 Foundation Pack 定义和检测编排**

```ts
export type FoundationTool = 'beads' | 'superpowers'

export function getDefaultFoundationPack() {
  return {
    id: 'default-foundation',
    items: ['beads', 'superpowers'] satisfies FoundationTool[],
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/foundation/foundation-installer.test.ts tests/foundation/foundation-doctor.test.ts tests/cli/system-foundation-command.test.ts`
Expected: PASS

- [ ] **Step 5: 提交 Foundation Pack 骨架**

```bash
git add src/foundation src/commands/system/system-foundation-command.ts src/install/install-types.ts src/install/install-manifest.ts tests/foundation/foundation-installer.test.ts tests/foundation/foundation-doctor.test.ts tests/cli/system-foundation-command.test.ts
git commit -m "feat: add foundation pack bootstrap"
```

### Task 2: 安装阶段基础组合接管与官方安装编排

**Files:**
- Modify: `scripts/install.sh`
- Modify: `scripts/install.ps1`
- Modify: `install.sh`
- Modify: `install.ps1`
- Modify: `src/install/postinstall.js`
- Create: `src/foundation/foundation-official-installers.ts`
- Test: `tests/foundation/foundation-installer.test.ts`
- Test: `tests/foundation/foundation-doctor.test.ts`
- Test: `tests/install/install-script.test.ts`

- [ ] **Step 1: 补一个失败测试，约束安装阶段会触发基础组合检测**

```ts
it('runs foundation setup during install flow', async () => {
  const result = await runInstallScriptDryRun()
  expect(result.stdout).toContain('foundationPack: beads, superpowers')
})

it('rolls back foundation state when official install fails', async () => {
  const result = await ensureFoundationPack({
    installTool: async () => {
      throw new Error('install failed')
    },
  })
  expect(result.installed).toEqual([])
  expect(result.failed).toContain('beads')
})

it('can repair a missing tool through foundation doctor', async () => {
  const result = await repairFoundationPack({
    detectTool: async () => null,
    installTool: async () => ({ version: '1.0.0' }),
  })
  expect(result.repaired).toContain('beads')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/install/install-script.test.ts tests/foundation/foundation-installer.test.ts tests/foundation/foundation-doctor.test.ts`
Expected: FAIL，因为安装脚本还没有基础组合接管输出，也没有 repair / 回滚行为。

- [ ] **Step 3: 为 beads 和 superpowers 封装官方安装策略**

```ts
export async function installFoundationTool(tool: FoundationTool) {
  if (tool === 'beads') return runOfficialBeadsInstall()
  if (tool === 'superpowers') return runOfficialSuperpowersInstall()
}
```

- [ ] **Step 4: 把安装脚本接到 Foundation Pack 流程**

Run: `pnpm vitest run tests/install/install-script.test.ts tests/foundation/foundation-installer.test.ts tests/foundation/foundation-doctor.test.ts`
Expected: PASS，并能看到 dry-run 输出、repair 路径和失败回滚都成立。

- [ ] **Step 5: 提交安装阶段基础组合接管**

```bash
git add scripts/install.sh scripts/install.ps1 install.sh install.ps1 src/foundation src/install/postinstall.js tests/foundation/foundation-installer.test.ts tests/foundation/foundation-doctor.test.ts tests/install/install-script.test.ts
git commit -m "feat: install foundation pack during setup"
```

### Task 3: 项目级 Profile 模型与独立协作配置

**Files:**
- Create: `src/commands/init/init-profile.ts`
- Create: `src/project/project-orchestration-config.ts`
- Modify: `src/project/project-config.ts`
- Test: `tests/project/project-config.test.ts`

- [ ] **Step 1: 写失败测试，约束 init 支持 project profile**

```ts
it('stores the selected profile in the orchestration config block', async () => {
  const result = await writeProjectConfig({
    profile: 'collaboration',
  })
  expect(result.config.orchestration.profile.selected).toBe('collaboration')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/project/project-config.test.ts`
Expected: FAIL，因为当前项目配置里还没有独立 orchestration block。

- [ ] **Step 3: 实现 default / collaboration / minimal 三个 profile 定义**

```ts
export const initProfiles = ['default', 'collaboration', 'minimal'] as const
```

- [ ] **Step 4: 把选中的 profile 写入独立 orchestration 配置块**

Run: `pnpm vitest run tests/project/project-config.test.ts`
Expected: PASS

- [ ] **Step 5: 提交 profile 模型**

```bash
git add src/commands/init/init-profile.ts src/project/project-orchestration-config.ts src/project/project-config.ts tests/project/project-config.test.ts
git commit -m "feat: add project orchestration profile config"
```

### Task 4: 阶段 / 角色 / 平台 编排模型

**Files:**
- Create: `src/runtime/orchestrators/stage-orchestrator.ts`
- Create: `src/runtime/orchestrators/role-orchestrator.ts`
- Create: `src/runtime/orchestrators/platform-resolver.ts`
- Create: `src/platforms/platform-contract.ts`
- Create: `src/platforms/codex-adapter.ts`
- Create: `src/platforms/claude-code-adapter.ts`
- Create: `src/platforms/qoder-adapter.ts`
- Create: `src/platforms/trae-adapter.ts`
- Modify: `src/commands/init/init-command.ts`
- Modify: `src/project/project-orchestration-config.ts`
- Test: `tests/runtime/stage-role-orchestrator.test.ts`
- Test: `tests/runtime/platform-resolver.test.ts`
- Test: `tests/platforms/platform-contract.test.ts`
- Test: `tests/cli/init-command-phase2.test.ts`

- [ ] **Step 1: 写失败测试，约束阶段 / 角色 / 平台三层抽象成立**

```ts
it('maps design stage to designer role', async () => {
  const { resolveRoleForStage } = await import('@/runtime/orchestrators/role-orchestrator.js')
  expect(resolveRoleForStage('design')).toBe('designer')
})

it('recommends codex for design stage when codex is available', async () => {
  const result = await resolvePlatform({
    stage: 'design',
    role: 'designer',
    availablePlatforms: ['codex', 'claude_code'],
  })
  expect(result.recommended).toBe('codex')
})

it('builds a platform resolution with override, recommended and effective values', async () => {
  const result = await resolvePlatform({
    stage: 'implement',
    role: 'coder',
    availablePlatforms: ['codex', 'claude_code'],
    override: null,
    recommended: 'claude_code',
    source: 'auto-detect',
  })
  expect(result.effective).toBe('claude_code')
  expect(result.source).toBe('auto-detect')
})

it('defines a shared platform adapter contract', async () => {
  const { createPlatformContract } = await import('@/platforms/platform-contract.js')
  expect(createPlatformContract('codex').platformId).toBe('codex')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/runtime/stage-role-orchestrator.test.ts tests/runtime/platform-resolver.test.ts tests/platforms/platform-contract.test.ts tests/cli/init-command-phase2.test.ts`
Expected: FAIL，因为阶段 / 角色 / 平台编排层和平台契约都还不存在。

- [ ] **Step 3: 实现阶段编排、角色映射和平台解析结构**

```ts
export type StageId = 'analysis' | 'design' | 'implement' | 'verify' | 'repair' | 'review'
export type RoleId = 'designer' | 'coder' | 'tester' | 'fixer' | 'reviewer'
export type PlatformId = 'codex' | 'claude_code' | 'qoder' | 'trae' | 'manual'

export type PlatformRecommendation = {
  stage: StageId
  role: RoleId
  recommended: PlatformId
  detected: PlatformId[]
  reasons: string[]
}

export type PlatformResolution = {
  stage: StageId
  role: RoleId
  override: PlatformId | null
  recommended: PlatformId
  effective: PlatformId
  source: 'override' | 'project-rule' | 'auto-detect' | 'fallback'
  reasons: string[]
}
```

- [ ] **Step 4: 把阶段 / 角色 / 平台 决策快照写入独立 orchestration 配置块，并接入 init 输出**

Run: `pnpm vitest run tests/runtime/stage-role-orchestrator.test.ts tests/runtime/platform-resolver.test.ts tests/platforms/platform-contract.test.ts tests/cli/init-command-phase2.test.ts`
Expected: PASS

- [ ] **Step 5: 提交阶段 / 角色 / 平台 编排层**

```bash
git add src/runtime/orchestrators src/platforms src/commands/init/init-command.ts src/project/project-orchestration-config.ts tests/runtime/stage-role-orchestrator.test.ts tests/runtime/platform-resolver.test.ts tests/platforms/platform-contract.test.ts tests/cli/init-command-phase2.test.ts
git commit -m "feat: add stage role platform orchestration model"
```

### Task 5: UI 基础设施前置

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `vitest.config.ts`
- Create: `src/ui/main.tsx`
- Create: `src/ui/app/vite-env.d.ts`
- Create: `tests/ui/setup.ts`
- Test: `tests/ui/ui-infra.test.ts`

- [ ] **Step 1: 写失败测试，约束仓库已具备 React/Vite/jsdom/shadcn 基础设施**

```ts
it('exposes the ui build stack and jsdom test environment', async () => {
  const pkg = require('../../package.json')
  expect(pkg.devDependencies.react).toBeDefined()
  expect(pkg.devDependencies.vite).toBeDefined()
  expect(pkg.dependencies['@radix-ui/react-dialog']).toBeDefined()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/ui/ui-infra.test.ts`
Expected: FAIL，因为当前仓库还没有 `Tauri + React + Vite + shadcn/ui` 基础设施和 jsdom 测试环境。

- [ ] **Step 3: 补齐 UI 依赖、tsx 编译覆盖和 Vitest DOM 环境**

```json
{
  "devDependencies": {
    "react": "...",
    "react-dom": "...",
    "vite": "...",
    "jsdom": "...",
    "@testing-library/react": "...",
    "@testing-library/jest-dom": "..."
  },
  "dependencies": {
    "@radix-ui/react-dialog": "...",
    "class-variance-authority": "...",
    "clsx": "...",
    "tailwind-merge": "..."
  }
}
```

```ts
// vitest.config.ts
test: {
  environment: 'jsdom',
  setupFiles: ['tests/ui/setup.ts'],
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/ui/ui-infra.test.ts`
Expected: PASS

- [ ] **Step 5: 提交 UI 基础设施**

```bash
git add package.json tsconfig.json vitest.config.ts src/ui/main.tsx src/ui/app/vite-env.d.ts tests/ui/setup.ts tests/ui/ui-infra.test.ts
git commit -m "feat: add ui infrastructure baseline"
```

### Task 6: UI 工程壳与主题令牌

**Files:**
- Create: `src/ui/app/layout.tsx`
- Create: `src/ui/app/router.tsx`
- Create: `src/ui/app/navigation.tsx`
- Create: `src/ui/theme/tokens.ts`
- Create: `src/ui/theme/status-tags.ts`
- Test: `tests/ui/layout.test.tsx`

- [ ] **Step 1: 写一个失败测试，约束 UI 壳存在左导航和右侧上下文面板**

```tsx
it('renders the desktop shell with navigation and context panel', () => {
  render(<AppLayout />)
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
  expect(screen.getByTestId('context-panel')).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/ui/layout.test.tsx`
Expected: FAIL，因为 UI 入口和布局尚不存在。

- [ ] **Step 3: 搭建最小 Tauri + React + Vite + shadcn/ui UI 壳**

```tsx
export function AppLayout() {
  return (
    <div className="app-shell">
      <aside>Dashboard</aside>
      <main />
      <section data-testid="context-panel" />
    </div>
  )
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/ui/layout.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交 UI 壳**

```bash
git add src/ui tests/ui/layout.test.tsx
git commit -m "feat: scaffold tauri desktop console shell"
```

### Task 7: Project Init Wizard 页面骨架

**Files:**
- Create: `src/ui/pages/init-wizard/project-init-wizard-page.tsx`
- Create: `src/ui/pages/init-wizard/init-wizard-state.ts`
- Test: `tests/ui/project-init-wizard.test.tsx`

- [ ] **Step 1: 写失败测试，约束向导至少有 5 个步骤**

```tsx
it('renders the project init wizard steps', () => {
  render(<ProjectInitWizardPage />)
  expect(screen.getByText('项目扫描')).toBeInTheDocument()
  expect(screen.getByText('Profile 选择')).toBeInTheDocument()
  expect(screen.getByText('平台解析')).toBeInTheDocument()
  expect(screen.getByText('初始化确认')).toBeInTheDocument()
  expect(screen.getByText('初始化完成')).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/ui/project-init-wizard.test.tsx`
Expected: FAIL

- [ ] **Step 3: 按设计简报实现向导页面骨架**

```tsx
const wizardSteps = ['项目扫描', 'Profile 选择', '平台解析', '初始化确认', '初始化完成']
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/ui/project-init-wizard.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交初始化向导骨架**

```bash
git add src/ui/pages/init-wizard tests/ui/project-init-wizard.test.tsx
git commit -m "feat: add project init wizard shell"
```

### Task 8: Dashboard / Tasks / Run Detail 首批页面骨架

**Files:**
- Create: `src/ui/pages/dashboard/dashboard-page.tsx`
- Create: `src/ui/pages/tasks/tasks-page.tsx`
- Create: `src/ui/pages/runs/run-detail-page.tsx`
- Create: `src/ui/components/status-tag.tsx`
- Create: `src/ui/components/metric-card.tsx`
- Test: `tests/ui/dashboard-page.test.tsx`
- Test: `tests/ui/tasks-page.test.tsx`
- Test: `tests/ui/run-detail-page.test.tsx`

- [ ] **Step 1: 写 3 个失败测试，分别约束总览、任务中心和运行详情骨架**

```tsx
it('renders dashboard metrics', () => {
  render(<DashboardPage />)
  expect(screen.getByText('项目总数')).toBeInTheDocument()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/ui/dashboard-page.test.tsx tests/ui/tasks-page.test.tsx tests/ui/run-detail-page.test.tsx`
Expected: FAIL

- [ ] **Step 3: 实现首批页面骨架和通用组件**

```tsx
export function StatusTag({ label }: { label: string }) {
  return <span>{label}</span>
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/ui/dashboard-page.test.tsx tests/ui/tasks-page.test.tsx tests/ui/run-detail-page.test.tsx`
Expected: PASS

- [ ] **Step 5: 提交首批页面骨架**

```bash
git add src/ui/pages src/ui/components tests/ui/dashboard-page.test.tsx tests/ui/tasks-page.test.tsx tests/ui/run-detail-page.test.tsx
git commit -m "feat: add core console page shells"
```

### Task 9: UI 读模型与 CLI 数据承接

**Files:**
- Create: `src/ui/state/read-model.ts`
- Create: `src/ui/state/demo-data.ts`
- Modify: `src/db/catalog-store.ts`
- Modify: `src/db/task-store.ts`
- Test: `tests/ui/read-model.test.ts`

- [ ] **Step 1: 写失败测试，约束现有 SQLite 数据可映射到 UI 读模型**

```ts
it('builds dashboard and task read models from catalog and task stores', async () => {
  const model = await buildReadModel()
  expect(model.dashboard).toBeDefined()
  expect(model.tasks).toBeDefined()
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/ui/read-model.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现 UI 读模型组合层**

```ts
export type ConsoleReadModel = {
  dashboard: object
  projects: object[]
  tasks: object[]
  runs: object[]
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/ui/read-model.test.ts`
Expected: PASS

- [ ] **Step 5: 提交 UI 读模型**

```bash
git add src/ui/state src/db/catalog-store.ts src/db/task-store.ts tests/ui/read-model.test.ts
git commit -m "feat: add console read model adapter"
```

### Task 10: 第二阶段基础回归与文档同步

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `README.ja.md`
- Modify: `docs/specs/foxpilot-phase2-ui-design-brief.md`
- Modify: `docs/workspace/task-foxpilot-phase2-local-orchestration-definition.md`

- [ ] **Step 1: 补第二阶段入口说明和实施状态说明**

```text
README 中补充：
- Foundation Pack
- 项目级 profile
- 阶段 / 角色 / 平台 模型
- 桌面控制台状态
```

- [ ] **Step 2: 运行第二阶段关键验证命令**

Run:
```bash
pnpm typecheck
pnpm test
pnpm build
```

Expected: 全部通过，并补齐 UI 壳、Foundation Pack 和 init 增强的相关测试。

- [ ] **Step 3: 提交文档与回归结果**

```bash
git add README.md README.en.md README.ja.md docs/specs/foxpilot-phase2-ui-design-brief.md docs/workspace/task-foxpilot-phase2-local-orchestration-definition.md
git commit -m "docs: sync phase 2 implementation status"
```
