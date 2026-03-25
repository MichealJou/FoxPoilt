# FoxPilot 第一阶段 init 命令初始化设计

## 1. 目标

`FoxPilot init` 的作用不是“开始执行任务”，而是把一个本地项目正式接入 FoxPilot。

第一阶段固定要求同时兼容：

- 完整命令：`foxpilot init`
- 简写命令：`fp init`

第一阶段的初始化目标固定为：

- 确认项目根路径
- 生成项目本地配置
- 确认或补齐全局配置
- 初始化 SQLite 数据底座
- 把项目、仓库注册到全局索引中

第一阶段不要求：

- 自动生成复杂任务
- 自动接入 Beads
- 自动生成桌面端视图
- 自动扫描全量代码语义

因此，`init` 在第一阶段的定位是：

- 接管入口
- 配置生成器
- 索引初始化器

## 2. 方案比较

`init` 有 3 种常见设计方式：

### 2.1 纯全局初始化

特点：

- 只写全局配置和 SQLite
- 不在项目目录落本地文件

优点：

- 命令实现简单

缺点：

- 项目迁移时上下文无法跟着走
- 不利于人工阅读与协作

### 2.2 纯项目本地初始化

特点：

- 只在项目内生成 `.foxpilot/project.json`
- 不碰全局索引

优点：

- 可迁移性强

缺点：

- 无法直接支撑多项目总览
- 后续桌面端和任务列表需要再次导入

### 2.3 混合初始化

这是第一阶段推荐方案。

特点：

- 项目内生成 `.foxpilot/project.json`
- 全局目录中维护 `foxpilot.config.json`
- 初始化全局 SQLite
- 同时写入项目与仓库索引

优点：

- 同时满足可迁移和集中管理
- 与当前“文件配置 + SQLite 运行态”方向一致

缺点：

- 比单一路径略复杂

## 3. 设计结论

第一阶段采用混合初始化方案。

命令的固定职责是：

1. 接收一个目标项目路径
2. 扫描并识别项目下仓库
3. 生成项目本地配置文件
4. 确保全局配置目录存在
5. 确保 SQLite 数据库存在
6. 将项目与仓库写入索引

初始化成功后，FoxPilot 就具备：

- 项目本地可读配置
- 全局多项目可查询索引
- 后续任务与运行记录可落库的基础

## 4. 路径与产物约定

### 4.1 全局目录

第一阶段建议固定全局目录：

- `~/.foxpilot/`

目录内主要产物：

- `~/.foxpilot/foxpilot.config.json`
- `~/.foxpilot/foxpilot.db`

原因：

- 与项目目录解耦
- 适合多项目统一管理
- 对桌面端和 CLI 都稳定

### 4.2 项目目录

每个项目内生成：

- `<project-root>/.foxpilot/project.json`

第一阶段不要求额外生成：

- 本地数据库
- 本地缓存目录
- 本地日志目录

## 5. 命令形式

第一阶段建议同时支持完整命令和简写命令。

完整命令：

```bash
foxpilot init
foxpilot init --path /absolute/path/to/project
```

简写命令：

```bash
fp init
fp init --path /absolute/path/to/project
```

说明：

- 不传 `--path` 时，默认以当前目录作为项目根目录
- 传 `--path` 时，按指定目录初始化
- `foxpilot` 与 `fp` 是等价入口
- 后续帮助信息与示例中，优先展示完整命令，同时保留简写示例

第一阶段建议支持以下可选参数：

```bash
foxpilot init --name <project-name>
foxpilot init --workspace-root <root-path>
foxpilot init --mode interactive
foxpilot init --mode non-interactive
foxpilot init --no-scan
```

```bash
fp init --name <project-name>
fp init --workspace-root <root-path>
fp init --mode interactive
fp init --mode non-interactive
fp init --no-scan
```

参数说明：

- `--name`
  - 显式指定项目名
  - 不传时默认使用目录名
- `--workspace-root`
  - 显式指定所属工作区根目录
  - 不传时由命令自动推断
- `--mode`
  - `interactive`：交互式确认
  - `non-interactive`：使用默认策略直接落地
- `--no-scan`
  - 不扫描子仓库
  - 只把目标目录本身作为一个项目接入

第一阶段不建议一开始就支持过多参数，例如：

- `--force`
- `--dry-run`
- `--template`
- `--executor-policy`

这些可以在第二阶段后再补。

## 6. 输入信息与默认推断

`init` 至少需要确定以下输入：

1. 项目根路径
2. 项目名
3. 所属工作区根目录
4. 仓库列表

默认推断规则建议如下：

### 6.1 项目根路径

- `--path` 优先
- 否则使用当前工作目录

### 6.2 项目名

- `--name` 优先
- 否则取项目根目录 basename

### 6.3 工作区根目录

优先顺序：

1. `--workspace-root`
2. 已存在全局配置中的命中根目录
3. 项目目录的上一级目录

例如：

- 项目路径为 `/Users/program/code/foxpilot-workspace`
- 默认推断工作区根目录为 `/Users/program/code`

### 6.4 仓库列表

默认行为：

- 扫描项目根目录自身是否为 git 仓库
- 扫描项目根目录下的子目录是否为 git 仓库
- 生成初始仓库候选列表

第一阶段扫描建议保持保守：

- 默认只扫当前目录与一层子目录
- 不做深层递归
- 不做复杂技术栈识别

## 7. 初始化流程

第一阶段推荐的命令执行流程如下：

### 7.1 前置校验

- 校验目标路径存在
- 校验目标路径是目录
- 校验项目内是否已经存在 `.foxpilot/project.json`

若已存在：

- 默认提示“项目已初始化”
- 第一阶段不做覆盖写入主流程

### 7.2 收集上下文

- 识别项目名
- 推断工作区根目录
- 扫描仓库候选项

### 7.3 生成项目本地配置

输出：

- `<project-root>/.foxpilot/project.json`

该文件至少包含：

- 项目名
- 展示名
- 根路径
- 状态
- 仓库列表

### 7.4 确保全局配置存在

输出：

- `~/.foxpilot/foxpilot.config.json`

若文件不存在：

- 初始化默认结构

若文件已存在：

- 合并工作区根目录
- 不覆盖已有默认行为

### 7.5 确保 SQLite 存在

输出：

- `~/.foxpilot/foxpilot.db`

若数据库不存在：

- 创建基础表

若数据库已存在：

- 校验表是否存在
- 不重复初始化已有表

### 7.6 写入索引

写入内容：

- `workspace_root`
- `project`
- `repository`

第一阶段 `init` 不写入：

- `task`
- `task_run`
- `project_config`

除非后续有显式项目覆盖项，否则 `project_config` 可为空。

## 8. 生成文件建议

### 8.1 全局配置示例

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

### 8.2 项目本地配置示例

建议结构：

```json
{
  "name": "foxpilot-workspace",
  "displayName": "Foxpilot Workspace",
  "rootPath": "/Users/program/code/foxpilot-workspace",
  "status": "managed",
  "repositories": [
    {
      "name": "root",
      "path": ".",
      "repoType": "directory",
      "languageStack": ""
    }
  ]
}
```

说明：

- 若项目根目录本身就是一个仓库，可以记录为 `path = "."`
- 若扫描到多个子仓库，则加入更多仓库项

## 9. 交互模式与非交互模式

### 9.1 interactive

交互模式下，命令应逐步确认：

1. 目标路径
2. 项目名
3. 工作区根目录
4. 识别出的仓库列表
5. 最终写入确认

适合首次接管和目录结构不稳定的项目。

### 9.2 non-interactive

非交互模式下，命令按默认推断直接执行：

- 自动推断项目名
- 自动推断工作区根目录
- 自动生成仓库列表
- 自动写入配置与索引

适合批量接入和脚本化场景。

## 10. 错误处理

第一阶段建议显式处理以下错误：

### 10.1 路径不存在

直接失败，提示目标目录不存在。

### 10.2 已初始化

直接提示项目已初始化，不默认覆盖。

### 10.3 全局配置损坏

直接失败，提示配置文件格式错误。

### 10.4 SQLite 初始化失败

直接失败，且不应留下半初始化状态说明不清的问题。

### 10.5 仓库扫描为空

不视为错误。

此时仍允许把该目录作为普通项目接入。

## 11. 与现有规格的关系

`init` 设计与当前文档的对应关系如下：

- [foxpilot-phase1-spec.md](/Users/program/code/foxpilot-workspace/docs/specs/foxpilot-phase1-spec.md)
  - 负责定义产品范围与接管目标
- [foxpilot-phase1-config-model.md](/Users/program/code/foxpilot-workspace/docs/specs/foxpilot-phase1-config-model.md)
  - 负责定义配置结构
- [foxpilot-phase1-sqlite-schema.md](/Users/program/code/foxpilot-workspace/docs/specs/foxpilot-phase1-sqlite-schema.md)
  - 负责定义持久化表结构

`foxpilot init` / `fp init` 则负责把这三者真正串起来。

## 12. 第一阶段不做的 init 能力

以下能力明确不进入第一阶段：

- 自动同步 Beads 任务
- 自动创建默认任务
- 自动识别复杂模块边界
- 自动生成桌面端项目卡片配置
- 自动接入记忆系统
- 自动修复已有配置冲突

## 13. 当前结论

第一阶段的 `foxpilot init` / `fp init` 应该是一个“轻接管、轻扫描、轻落库”的初始化命令。

它的最小闭环是：

1. 生成 `.foxpilot/project.json`
2. 确保 `~/.foxpilot/foxpilot.config.json`
3. 确保 `~/.foxpilot/foxpilot.db`
4. 把项目和仓库写入索引

只要这 4 步稳定，FoxPilot 就已经具备了从“抽象产品定义”进入“可执行初始化”的基础。
