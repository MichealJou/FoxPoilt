# FoxPilot CLI 命令参考（中文）

本文档用于解释 FoxPilot 当前所有公开命令的用途、常见参数、典型使用场景和常见组合。

> 🧾 这份文档是一份“命令手册”。
>
> 如果你只想先装起来并快速上手，请先看 [README.md](../../README.md)。

## 📘 读取方式

### 命令名

文档默认使用完整命令名 `foxpilot`。  
所有命令都可以用简写 `fp` 等价执行。

### 常见公共参数

- `--help`
  - 查看当前命令帮助
- `--path`
  - 显式指定项目根目录
- `--repository`
  - 显式指定仓库名
- `--id`
  - 用 FoxPilot 内部任务 ID 定位任务
- `--external-id`
  - 用外部任务号直接定位任务
- `--dry-run`
  - 只预演，不落库、不写文件

## 🧭 命令速查

### 系统命令

| 命令 | 一句话说明 |
| --- | --- |
| `foxpilot version` | 查看当前 CLI 版本 |
| `foxpilot install-info` | 查看当前安装来源、版本、路径和安装实例 |
| `foxpilot update` | 沿用当前安装来源执行更新 |

### 初始化与配置命令

| 命令 | 一句话说明 |
| --- | --- |
| `foxpilot init` | 初始化当前项目 |
| `foxpilot config set-language` | 设置 CLI 交互语言 |

### 手动任务命令

| 命令 | 一句话说明 |
| --- | --- |
| `foxpilot task create` | 创建一条手动任务 |
| `foxpilot task list` | 查看当前项目任务列表 |
| `foxpilot task next` | 选择下一条最值得推进的任务 |
| `foxpilot task edit` | 修改任务标题、描述和类型 |
| `foxpilot task show` | 查看单条任务详情 |
| `foxpilot task history` | 查看任务历史记录 |
| `foxpilot task update-status` | 更新任务状态 |
| `foxpilot task update-executor` | 更新任务责任执行器 |
| `foxpilot task update-priority` | 更新任务优先级 |
| `foxpilot task suggest-scan` | 生成扫描建议任务 |

### Beads 协作命令

| 命令 | 一句话说明 |
| --- | --- |
| `foxpilot task import-beads` | 从快照导入 Beads 任务 |
| `foxpilot task diff-beads` | 预览导入差异 |
| `foxpilot task sync-beads` | 从本地 `bd` 直接同步 |
| `foxpilot task doctor-beads` | 诊断本地 Beads 环境 |
| `foxpilot task init-beads` | 初始化本地 `.beads` 环境 |
| `foxpilot task push-beads` | 把当前状态回写到本地 `bd` |
| `foxpilot task export-beads` | 导出 Beads 快照 |
| `foxpilot task beads-summary` | 查看 Beads 聚合摘要 |

## 🖥 系统命令

### `foxpilot version`

**用途**

- 查看当前 CLI 版本

**什么时候用**

- 刚装完，想确认命令是否可用
- 发布后，想确认本机已经升级到哪个版本

**常用参数**

- 无

**示例**

```bash
foxpilot version
```

**补充说明**

- 这是最适合拿来确认“装没装好”的第一条命令

---

### `foxpilot install-info`

**用途**

- 查看当前安装来源、版本、安装路径和已登记安装实例

**什么时候用**

- 你不确定自己是通过 `npm`、`brew` 还是脚本安装的
- 你想排查为什么 `update` 会走某一条更新链路

**常用参数**

- 无

**示例**

```bash
foxpilot install-info
```

**补充说明**

- 这条命令适合排查“安装方式”和“更新方式”问题

---

### `foxpilot update`

**用途**

- 沿用当前安装来源执行更新

**什么时候用**

- `npm` 安装后想升级到最新版本
- `brew` 安装后想保持通过 `brew` 升级

**常用参数**

- 无

**示例**

```bash
foxpilot update
```

**补充说明**

- 不同安装渠道的更新动作不同，但用户入口统一就是这条命令

## ⚙️ 初始化与配置命令

### `foxpilot init`

**用途**

- 把当前目录初始化成受 FoxPilot 管理的项目

**会做什么**

- 生成 `.foxpilot/project.json`
- 初始化全局配置
- 初始化本地 SQLite

**什么时候用**

- 第一次把一个项目接入 FoxPilot
- 想把现有项目纳入 FoxPilot 的任务管理边界

**常用参数**

- `--path`
- `--name`
- `--workspace-root`
- `--mode interactive|non-interactive`
- `--no-scan`

**示例**

```bash
foxpilot init
foxpilot init --mode non-interactive --path /path/to/project
```

**补充说明**

- 对大多数用户来说，这是安装后第一条真正要执行的业务命令

---

### `foxpilot config set-language`

**用途**

- 设置 CLI 交互语言

**支持值**

- `zh-CN`
- `en-US`
- `ja-JP`

**什么时候用**

- 首次安装后想切换交互语言
- 多语言环境下想统一团队默认显示语言

**常用参数**

- `--lang`

**示例**

```bash
foxpilot config set-language --lang zh-CN
foxpilot config set-language --lang en-US
foxpilot config set-language --lang ja-JP
```

## 📝 手动任务命令

### `foxpilot task create`

**用途**

- 创建一条手动任务

**什么时候用**

- 临时发现一项工作，需要先登记
- 某项工作还没有进入外部系统，但需要先纳入本地任务池

**常用参数**

- `--title`
- `--description`
- `--priority`
- `--task-type`
- `--repository`

**示例**

```bash
foxpilot task create --title "补充初始化说明"
foxpilot task create --title "修复导入提示" --priority P1 --task-type docs
```

**补充说明**

- 从这一条开始，FoxPilot 才真正进入“任务管理”状态

---

### `foxpilot task list`

**用途**

- 列出当前项目任务

**什么时候用**

- 想看当前项目里都有哪些任务
- 想按状态、来源、执行器筛一遍任务

**常用参数**

- `--status`
- `--source`
- `--executor`

**示例**

```bash
foxpilot task list
foxpilot task list --status todo --executor codex
foxpilot task list --source scan_suggestion --executor beads
```

**补充说明**

- 这是最常用的“总览命令”

---

### `foxpilot task next`

**用途**

- 从当前项目里选出下一条最值得推进的任务

**什么时候用**

- 你不知道下一步该做什么
- 你只想快速挑一条最合适的任务先动手

**常用参数**

- `--source`
- `--executor`

**示例**

```bash
foxpilot task next
foxpilot task next --executor codex
```

**补充说明**

- 当你不知道下一步做什么时，优先用这条命令

---

### `foxpilot task edit`

**用途**

- 修改任务标题、描述和任务类型

**什么时候用**

- 任务标题不准确
- 需要补充任务说明
- 需要显式清空旧描述
- 需要调整任务分类

**常用参数**

- `--id`
- `--external-id`
- `--title`
- `--description`
- `--clear-description`
- `--task-type`

**示例**

```bash
foxpilot task edit --id task:example --title "补充任务说明"
foxpilot task edit --external-id BEADS-1001 --clear-description
foxpilot task edit --id task:example --task-type docs
```

---

### `foxpilot task show`

**用途**

- 查看单条任务详情

**什么时候用**

- 想看某条任务的状态、执行器、优先级、来源和目标
- 想直接查看导入任务对应的外部任务号

**常用参数**

- `--id`
- `--external-id`
- `--external-source`

**示例**

```bash
foxpilot task show --id task:example
foxpilot task show --external-id BEADS-1001
```

**补充说明**

- `show` 适合看单任务，`list` 适合看全局

---

### `foxpilot task history`

**用途**

- 查看任务历史运行记录

**什么时候用**

- 想回看任务状态变化
- 想判断任务是否经历过多次执行与收口

**常用参数**

- `--id`
- `--external-id`

**示例**

```bash
foxpilot task history --id task:example
foxpilot task history --external-id BEADS-1001
```

---

### `foxpilot task update-status`

**用途**

- 更新任务状态

**什么时候用**

- 推进任务进入分析、执行、完成、阻塞或取消状态

**常用参数**

- `--id`
- `--external-id`
- `--status`

**支持状态**

- `todo`
- `analyzing`
- `awaiting_plan_confirm`
- `executing`
- `awaiting_result_confirm`
- `done`
- `blocked`
- `cancelled`

**示例**

```bash
foxpilot task update-status --id task:example --status executing
foxpilot task update-status --external-id BEADS-1001 --status blocked
```

**补充说明**

- 这是最常用的任务流转命令

---

### `foxpilot task update-executor`

**用途**

- 更新任务当前责任执行器

**什么时候用**

- 把任务责任从人工改到协作工具
- 或者把任务从协作工具切回人工处理

**常用参数**

- `--id`
- `--external-id`
- `--executor`

**支持值**

- `codex`
- `beads`
- `none`

**示例**

```bash
foxpilot task update-executor --id task:example --executor beads
foxpilot task update-executor --external-id BEADS-1002 --executor codex
```

---

### `foxpilot task update-priority`

**用途**

- 更新任务优先级

**什么时候用**

- 临时抬高某项修复优先级
- 把已不紧急的任务下调

**常用参数**

- `--id`
- `--external-id`
- `--priority`

**支持值**

- `P0`
- `P1`
- `P2`
- `P3`

**示例**

```bash
foxpilot task update-priority --id task:example --priority P0
foxpilot task update-priority --external-id BEADS-1002 --priority P2
```

---

### `foxpilot task suggest-scan`

**用途**

- 按已登记仓库生成扫描建议任务

**什么时候用**

- 项目初始化后，想快速补一批仓库级扫描建议

**常用参数**

- `--path`

**示例**

```bash
foxpilot task suggest-scan
```

## 🔗 Beads 协作命令

### `foxpilot task import-beads`

**用途**

- 从本地 JSON 快照导入 Beads 任务

**什么时候用**

- 你已经拿到一份外部快照文件
- 想先把外部任务批量引入当前项目

**常用参数**

- `--file`
- `--close-missing`
- `--dry-run`

**常见组合**

- `--dry-run`
  - 先预演导入结果
- `--close-missing`
  - 对当前快照中已经缺失的未完成任务做收口

**示例**

```bash
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json
foxpilot task import-beads --file ./examples/beads-snapshot.sample.json --dry-run --close-missing
```

**补充说明**

- 从外部快照进入 FoxPilot，先看这条命令

---

### `foxpilot task diff-beads`

**用途**

- 只读预览 Beads 导入差异

**什么时候用**

- 导入前，想先看会创建、更新、跳过还是收口哪些任务
- 不想直接写库，只想先做一次对账

**常用参数**

- `--file`
- `--repository`
- `--all-repositories`
- `--close-missing`

**示例**

```bash
foxpilot task diff-beads --file ./examples/beads-snapshot.sample.json
foxpilot task diff-beads --repository frontend
foxpilot task diff-beads --all-repositories
```

**补充说明**

- 这条命令只做预览，不真正写入

---

### `foxpilot task sync-beads`

**用途**

- 直接从本地 `bd list --json --all` 同步任务

**什么时候用**

- 不想经过快照文件
- 想直接和本地仓库里的 Beads 任务保持一致

**常用参数**

- `--repository`
- `--all-repositories`
- `--close-missing`
- `--dry-run`

**示例**

```bash
foxpilot task sync-beads --repository frontend
foxpilot task sync-beads --all-repositories --dry-run
foxpilot task sync-beads --repository frontend --close-missing
```

**补充说明**

- 如果你已经在仓库里直接使用 `bd`，这条通常比 `import-beads` 更顺手

---

### `foxpilot task doctor-beads`

**用途**

- 诊断本地 Beads 环境是否可用

**什么时候用**

- 某个仓库无法同步、导入或回写
- 想先确认本地 Beads 环境是否正常

**常用参数**

- `--repository`
- `--all-repositories`

**示例**

```bash
foxpilot task doctor-beads --repository frontend
foxpilot task doctor-beads --all-repositories
```

**补充说明**

- 环境不对时先做诊断，再做初始化和同步

---

### `foxpilot task init-beads`

**用途**

- 初始化本地 `.beads` 环境

**什么时候用**

- 当前项目已有仓库，但尚未初始化 Beads 工作目录

**常用参数**

- `--repository`
- `--all-repositories`
- `--dry-run`

**示例**

```bash
foxpilot task init-beads --repository frontend
foxpilot task init-beads --all-repositories --dry-run
```

---

### `foxpilot task push-beads`

**用途**

- 把 FoxPilot 当前任务状态回写到本地 `bd`

**什么时候用**

- 你已经在 FoxPilot 改过任务状态
- 需要把当前状态同步回本地 Beads 仓库

**常用参数**

- `--id`
- `--external-id`
- `--repository`
- `--all-repositories`
- `--dry-run`

**示例**

```bash
foxpilot task push-beads --external-id BEADS-1001
foxpilot task push-beads --repository frontend --dry-run
foxpilot task push-beads --all-repositories
```

**补充说明**

- 当你已经在 FoxPilot 改过任务状态，需要写回 `bd` 时，用这条命令

---

### `foxpilot task export-beads`

**用途**

- 把当前项目中的 Beads 同步任务导出为 JSON 快照

**什么时候用**

- 导出后交给其他本地流程继续处理
- 做本地备份或做快照对比

**常用参数**

- `--file`

**示例**

```bash
foxpilot task export-beads --file ./tmp/beads-export.json
```

---

### `foxpilot task beads-summary`

**用途**

- 查看当前项目中 Beads 同步任务的聚合摘要

**什么时候用**

- 快速看当前导入总量、状态分布和仓库覆盖情况

**常用参数**

- 无

**示例**

```bash
foxpilot task beads-summary
```

## 🧪 建议的上手顺序

如果你是第一次使用 FoxPilot，建议按下面顺序尝试：

1. `foxpilot version`
2. `foxpilot install-info`
3. `foxpilot init`
4. `foxpilot task create`
5. `foxpilot task list`
6. `foxpilot task next`
7. 如果要接入 Beads，再看 Beads 协作命令这一组
