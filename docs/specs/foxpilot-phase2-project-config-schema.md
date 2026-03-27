# FoxPilot 第二阶段项目配置结构

## 1. 文档目的

这份文档只定义一件事：

> 第二阶段 `<project>/.foxpilot/project.json` 应该长什么样，负责承载哪些输入，不承载哪些运行时结果。

如果没有这份结构，后面会出现：

- `project.json` 继续沿用第一阶段最小结构，不够承载第二阶段编排输入
- 运行时结果被硬塞回配置文件
- UI / CLI / Runtime 各自理解不同

## 2. 结构定位

第二阶段项目配置的定位是：

> 项目级显式输入与接管结果入口

它表示的是：

```text
用户选择了什么
项目声明了什么
系统应该优先尊重什么
```

它不表示：

```text
最近一次 session 现在跑到哪
最新 doctor 历史
事件流
```

## 3. 建议文件路径

```text
<project-root>/.foxpilot/project.json
```

## 4. 第二阶段配置结构

建议第二阶段统一为：

```ts
interface ProjectConfigV2 {
  version: 2
  projectId: string
  projectPath: string
  orchestration: ProjectOrchestrationConfig
}
```

其中：

```ts
interface ProjectOrchestrationConfig {
  profile: {
    selected: ProfileId
  }
  workflow: {
    selectedTemplateId: string
  }
  overrides: {
    templateId: string | null
    stageOverrides: StageOverride[]
    platformOverrides: PlatformOverride[]
  }
  bindings: {
    skillBindings: BindingRef[]
    mcpBindings: BindingRef[]
  }
  init: {
    initializedAt: string | null
    initializedBy: 'user' | 'system' | null
  }
}
```

## 5. 为什么要把 orchestration 单独成块

因为第二阶段新增的大部分东西都属于：

```text
编排输入
```

如果还像第一阶段一样平铺在最外层，后面：

- profile
- workflow template
- overrides
- bindings

会越来越乱。

## 6. 第一批必须有的字段

### 6.1 profile.selected

记录：

```text
default / collaboration / minimal
```

### 6.2 workflow.selectedTemplateId

记录：

```text
当前项目选中的工作流模板
```

### 6.3 overrides

记录：

```text
显式模板覆盖
阶段覆盖
平台覆盖
```

### 6.4 bindings

记录：

```text
项目级 Skill / MCP 显式绑定
```

## 7. 不应该进入 project.json 的内容

第二阶段明确禁止把这些写进 `project.json`：

```text
Execution Session 状态
Handoff 历史
Runtime Event 历史
Control Plane 快照
recommended / effective 的完整历史
```

这些都属于：

```text
SQLite 运行历史层
```

## 8. 与 Snapshot 的关系

必须明确：

### 8.1 project.json

表达：

```text
用户输入和显式覆盖
```

### 8.2 Project Orchestration Snapshot

表达：

```text
系统当前实际解析结果
```

两者不能混。

## 9. 与 Override Policy 的关系

`project.json` 是覆盖优先级中的重要来源之一，但不是最高来源。

它应服从：

```text
runtime-session override
> explicit user action
> project config
> template / profile / recommendation / fallback
```

## 10. 与 Init Wizard 的关系

第二阶段 `init.preview` 负责生成建议。

第二阶段 `init.apply` 负责把显式确认过的输入写进：

```text
project.json
```

## 11. 第一批范围控制

第二阶段第一批先不做：

- 用户在配置文件里自定义任意阶段图
- 用户在配置文件里直接写完整快照
- 多项目共享配置引用

先固定：

```text
稳定字段
稳定 orchestration block
稳定 overrides / bindings 入口
```

## 12. 审核点

你审核这份结构时，重点看：

```text
1  是否接受 orchestration 成为第二阶段 project.json 的核心块
2  是否接受 project.json 只存输入与显式覆盖，不存运行历史
3  是否接受 profile / workflow / overrides / bindings 四组一级输入
4  是否接受 snapshot、session、handoff、event 全部留在 SQLite 层
```
