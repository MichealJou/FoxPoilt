# FoxPilot 第二阶段 Runtime Core 目录结构

## 1. 文档目的

这份文档只解决一个问题：

> 第二阶段代码层面的目录应该怎么落，才能让 `Desktop / CLI / Runtime / Integrations / Infra` 真正分开。

它不是实现细节文档，也不是前端页面文档。  
它只固定：

- 哪些目录属于双入口
- 哪些目录属于共享核心
- 哪些目录属于协作集成层
- 哪些目录属于执行平台集成层

## 2. 总体目录结构

推荐目录结构如下：

```text
apps/
├─ desktop/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ pages/
│  │  ├─ components/
│  │  ├─ state/
│  │  ├─ bridge/
│  │  └─ theme/
│  └─ src-tauri/
│
apps/
└─ cli/
   └─ src/
      ├─ commands/
      ├─ adapter/
      └─ output/

packages/
├─ runtime/
│  ├─ app/
│  ├─ services/
│  ├─ orchestrators/
│  ├─ repositories/
│  ├─ read-models/
│  └─ errors/
│
├─ integrations/
│  ├─ facade/
│  ├─ collaboration/
│  │  ├─ beads/
│  │  ├─ superpowers/
│  │  ├─ skills/
│  │  └─ mcp/
│  └─ platforms/
│     ├─ codex/
│     ├─ claude-code/
│     ├─ qoder/
│     ├─ trae/
│     └─ future/
│
├─ contracts/
│  ├─ runtime/
│  ├─ desktop/
│  ├─ cli/
│  └─ platforms/
│
└─ infra/
   ├─ db/
   ├─ config/
   ├─ workspace/
   ├─ filesystem/
   └─ process/
```

## 3. 双入口目录

### 3.1 `apps/desktop`

这是桌面端入口。

负责：

- `Tauri` 桌面壳
- `React + Vite + shadcn/ui` 页面
- UI 读模型
- Desktop Bridge

不负责：

- 业务规则
- 任务状态流转
- 平台分配逻辑

建议子目录：

```text
apps/desktop/src/app
apps/desktop/src/pages
apps/desktop/src/components
apps/desktop/src/state
apps/desktop/src/bridge
apps/desktop/src/theme
apps/desktop/src-tauri
```

### 3.2 `apps/cli`

这是 CLI 入口。

负责：

- 命令路由
- 参数解析
- 输出适配
- `--json` 脚本化输出

不负责：

- 复制一套 Runtime 业务规则
- 直接操作外部能力

建议子目录：

```text
apps/cli/src/commands
apps/cli/src/adapter
apps/cli/src/output
```

## 4. 共享核心目录

### 4.1 `packages/runtime`

这是第二阶段真正的核心目录。

建议拆成：

```text
packages/runtime/app
packages/runtime/services
packages/runtime/orchestrators
packages/runtime/repositories
packages/runtime/read-models
packages/runtime/errors
```

### 4.2 `app`

负责：

- Runtime 统一入口
- Command -> Handler -> Result 组织
- 事务边界
- 错误归一

### 4.3 `services`

负责：

- `Foundation Service`
- `Init Service`
- `Profile Service`
- `Task Service`
- `Run Service`
- `Event Service`
- `Health Service`

### 4.4 `orchestrators`

负责：

- `Stage Orchestrator`
- `Role Orchestrator`
- `Platform Resolver`

这一层的职责是把：

```text
阶段
角色
平台
```

真正变成可执行的编排规则。

### 4.5 `repositories`

负责：

- 读写 SQLite
- 读写配置
- 组织仓库级持久化访问

这一层只做存取，不做业务判断。

### 4.6 `read-models`

负责：

- Dashboard 聚合
- 任务中心聚合
- 运行详情聚合
- 技能/MCP 列表聚合

这一层是给 UI 和 CLI `--json` 提供稳定读模型的。

## 5. 集成层目录

### 5.1 `packages/integrations/facade`

负责：

- 集成层统一入口
- 把 Runtime 请求分发到协作集成层或平台集成层

### 5.2 `packages/integrations/collaboration`

负责：

- `beads`
- `superpowers`
- `skills`
- `mcp`

建议每个子目录里至少有：

```text
manager.ts
detect.ts
doctor.ts
types.ts
```

### 5.3 `packages/integrations/platforms`

负责：

- `codex`
- `claude-code`
- `qoder`
- `trae`
- `future`

建议每个平台目录至少有：

```text
adapter.ts
detect.ts
doctor.ts
run-stage.ts
types.ts
```

## 6. 契约层目录

### 6.1 `packages/contracts/runtime`

负责：

- Runtime 命令对象
- Runtime 结果对象
- 错误对象

### 6.2 `packages/contracts/desktop`

负责：

- Desktop Bridge 请求
- Desktop 侧 UI 状态模型

### 6.3 `packages/contracts/cli`

负责：

- CLI JSON 输出结构
- 脚本化错误码

### 6.4 `packages/contracts/platforms`

负责：

- 多平台适配器统一契约
- 平台健康状态
- 平台执行结果

## 7. 基础设施层目录

### 7.1 `packages/infra/db`

负责：

- SQLite
- schema
- migrations

### 7.2 `packages/infra/config`

负责：

- 全局配置
- 项目配置
- 安装信息

### 7.3 `packages/infra/workspace`

负责：

- 工作区路径
- 仓库路径
- 项目文件组织

### 7.4 `packages/infra/filesystem`

负责：

- 文件存在性检查
- 文件读写
- 目录维护

### 7.5 `packages/infra/process`

负责：

- shell 调用
- 外部命令调用
- 环境变量透传

## 8. 硬边界

必须保持：

```text
apps/desktop 不直接访问 packages/infra/db
apps/desktop 不直接访问 packages/integrations/*
apps/cli 不自己实现业务规则
packages/integrations 不直接改 task / run / event 状态
packages/runtime 是唯一业务核心
```

## 9. 推荐迁移顺序

如果第二阶段后续要落代码，建议迁移顺序是：

```text
1  先拆 contracts
2  再拆 runtime
3  再拆 integrations
4  最后补 apps/desktop
5  CLI 最后再薄化为 adapter
```

这样能避免一边做 UI，一边反复改核心边界。

## 10. 审核点

你审核这份文档时，重点看：

```text
1  是否接受双入口目录和共享核心目录分开
2  是否接受 integrations 再拆成 collaboration / platforms
3  是否接受 read-models 单独成层
4  是否接受 apps/desktop 与 apps/cli 都不直接碰 infra
```
