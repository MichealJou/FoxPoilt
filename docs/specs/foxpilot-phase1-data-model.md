# FoxPilot 第一阶段通用数据模型

## 1. 设计目标

FoxPilot 的第一阶段数据模型必须满足以下目标：

- 支持多个工作区根目录
- 支持多个项目
- 支持一个项目下挂多个仓库
- 支持项目级任务、仓库级任务、跨仓库任务
- 不绑定具体技术栈
- 不绑定具体执行器
- 为后续桌面端、初始化工具和记忆系统预留扩展空间

因此，数据模型设计遵循：

- 项目优先于仓库
- 任务默认挂项目层
- 仓库是执行范围，不是唯一归属
- 执行器、方法流、任务来源都做成枚举或可扩展字段

## 2. 核心实体

第一阶段建议固定 7 个核心实体：

1. 工作区根目录
2. 项目
3. 仓库
4. 任务
5. 任务目标
6. 任务运行记录
7. 项目配置

## 3. 实体定义

### 3.1 工作区根目录 workspace_root

表示本地扫描起点。

字段建议：

- `id`
- `name`
- `path`
- `enabled`
- `description`
- `created_at`
- `updated_at`

说明：

- 一个用户可以配置多个工作区根目录
- 例如：
  - `/Users/program/code`
  - `/Users/program/demo`

### 3.2 项目 project

表示 FoxPilot 接管的最小管理单元，默认是一个根工作区项目。

字段建议：

- `id`
- `workspace_root_id`
- `name`
- `display_name`
- `root_path`
- `source_type`
- `status`
- `description`
- `created_at`
- `updated_at`

说明：

- `source_type`：
  - `auto_discovered`
  - `manual`
- `status`：
  - `pending`
  - `managed`
  - `disabled`
  - `archived`

### 3.3 仓库 repository

表示项目下的具体代码仓库。

字段建议：

- `id`
- `project_id`
- `name`
- `display_name`
- `path`
- `repo_type`
- `language_stack`
- `enabled`
- `created_at`
- `updated_at`

说明：

- `repo_type` 不要写死第一阶段技术栈，建议预留：
  - `git`
  - `directory`
  - `subrepo`
- `language_stack` 可先存文本：
  - `java-maven`
  - `node-pnpm`
  - `python`
  - `rust`

### 3.4 任务 task

FoxPilot 的任务默认挂在项目层。

字段建议：

- `id`
- `project_id`
- `title`
- `description`
- `source_type`
- `status`
- `priority`
- `task_type`
- `execution_mode`
- `requires_plan_confirm`
- `current_executor`
- `external_source`
- `external_id`
- `created_at`
- `updated_at`

说明：

- `source_type`：
  - `manual`
  - `beads_sync`
  - `scan_suggestion`
- `status`：
  - `todo`
  - `analyzing`
  - `awaiting_plan_confirm`
  - `executing`
  - `awaiting_result_confirm`
  - `done`
  - `blocked`
  - `cancelled`
- `priority`：
  - `P0`
  - `P1`
  - `P2`
  - `P3`
- `task_type`：
  - `generic`
  - `frontend`
  - `backend`
  - `cross_repo`
  - `docs`
  - `init`
- `execution_mode`：
  - `manual`
  - `semi_auto`
  - `auto`
- `current_executor`：
  - `codex`
  - `beads`
  - `none`
- `external_source`：
  - 第一阶段最小值先支持 `beads`
  - 手工任务允许为空
- `external_id`：
  - 保存外部系统中的稳定任务标识
  - 仅在外部同步任务中有值

### 3.5 任务目标 task_target

用于描述任务的执行范围。

字段建议：

- `id`
- `task_id`
- `repository_id`
- `target_type`
- `target_value`
- `created_at`

说明：

- `target_type`：
  - `repository`
  - `module`
  - `directory`
  - `file_group`

一个任务可以没有目标范围，也可以有多个目标范围。

这样支持：

- 项目级任务
- 单仓库任务
- 多仓库任务

### 3.6 任务运行记录 task_run

用于记录任务分析和执行历史。

字段建议：

- `id`
- `task_id`
- `run_type`
- `executor`
- `status`
- `summary`
- `started_at`
- `ended_at`
- `created_at`

说明：

- `run_type`：
  - `analysis`
  - `execution`
  - `verification`
- `executor`：
  - `codex`
  - `manual`
  - `future_reserved`
- `status`：
  - `running`
  - `success`
  - `failed`
  - `cancelled`

### 3.7 项目配置 project_config

用于保存项目的初始化与接管配置。

字段建议：

- `id`
- `project_id`
- `config_key`
- `config_value`
- `created_at`
- `updated_at`

说明：

- 第一阶段先用简单键值结构，避免过早做复杂配置系统
- 后续如果配置变复杂，再升级为 JSON 结构

## 4. 关系模型

### 4.1 主关系

- 一个工作区根目录可以包含多个项目
- 一个项目可以包含多个仓库
- 一个项目可以包含多个任务
- 一个任务可以指向多个任务目标
- 一个任务可以有多次运行记录

### 4.2 任务归属原则

固定原则：

- 任务归属项目
- 任务目标指向仓库或模块

不要把任务直接挂仓库作为主归属，否则跨仓库任务会变得混乱。

## 5. 第一阶段不做的模型

以下结构暂不进入第一阶段：

- 子任务树
- 工种型子代理
- 向量记忆表
- 评论/讨论流
- 多用户协作权限
- 自动 PR / 自动提交记录

这些都属于第二阶段之后再考虑的模型。

## 6. 通用性原则

FoxPilot 第一阶段必须保持以下通用性：

### 6.1 不绑定具体业务项目

不能出现：

- `bio_product`
- 某个固定目录结构
- 某个固定公司规则

### 6.2 不绑定具体技术栈

虽然当前实现背景有 Java / Vue / Tauri / React，但数据模型不能依赖这些。

### 6.3 不绑定单一执行器

第一阶段虽然以 Codex 为主，但模型中不要把执行器写死成唯一值。

## 7. 下一步建议

完成数据模型后，下一步建议进入：

1. SQLite 表结构设计
2. 本地配置文件结构设计
3. 命令初始化输入输出设计
