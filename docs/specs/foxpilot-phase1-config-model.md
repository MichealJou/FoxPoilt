# FoxPilot 第一阶段通用配置结构

## 1. 设计目标

FoxPilot 的配置结构需要满足：

- 支持多个工作区根目录
- 支持多个项目
- 支持项目手动接管
- 支持自动发现项目
- 不依赖固定技术栈
- 便于后续命令初始化工具生成

第一阶段配置采用“简单可读、易生成、易迁移”的策略。

## 2. 配置层次

建议分为三层：

1. 全局配置
2. 项目配置
3. 仓库配置

## 3. 全局配置

建议保存在：

- `foxpilot.config.json`

全局配置主要管理：

- 工作区根目录列表
- 默认扫描规则
- 默认任务行为
- 默认执行器

建议结构：

```json
{
  "workspaceRoots": [
    "/Users/program/code"
  ],
  "defaultProjectMode": "workspace_root",
  "defaultTaskView": "table",
  "defaultExecutor": "codex"
}
```

## 4. 项目配置

每个项目建议生成一份项目配置文件，位置建议：

- `.foxpilot/project.json`

项目配置管理：

- 项目名
- 根路径
- 接管状态
- 仓库列表
- 默认扫描范围
- 默认任务规则

建议结构：

```json
{
  "name": "bio_product",
  "displayName": "Bio Product",
  "rootPath": "/Users/program/code/bio_product",
  "status": "managed",
  "repositories": [
    {
      "name": "backend",
      "path": "backend/qdxl-bio-e-cloud-server",
      "repoType": "git",
      "languageStack": "java-maven"
    },
    {
      "name": "frontend",
      "path": "frontend/qdxl-bio-e-cloud-web",
      "repoType": "git",
      "languageStack": "node-pnpm"
    }
  ]
}
```

## 5. 仓库配置

第一阶段不建议单独做复杂仓库配置文件。

仓库配置先内嵌在项目配置中就够了。

后续如果某个仓库有复杂启动命令、规则入口、扫描忽略项，再单独拆分。

## 6. 通用约束

### 6.1 配置必须可迁移

不能依赖只在当前机器才成立的运行状态。

### 6.2 配置必须可生成

后续 `FoxPilot init` 命令要能自动生成这些配置。

### 6.3 配置必须可读

第一阶段优先让配置对人类也容易阅读和修改。

## 7. 下一步建议

完成配置模型后，下一步进入：

1. SQLite 表结构草案
2. `FoxPilot init` 初始化输入输出
3. 后续桌面端项目接管流程设计

