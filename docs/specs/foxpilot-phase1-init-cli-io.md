# FoxPilot 第一阶段 init CLI 输入输出清单

## 1. 目标

这份文档只定义 `foxpilot init` / `fp init` 的命令行输入输出契约。

它回答 4 个问题：

1. 用户可以怎么调用命令
2. 命令会向用户询问什么
3. 命令会输出什么结果
4. 命令在成功与失败时应如何表现

这份文档不进入：

- 具体代码实现
- 参数解析库选型
- TUI 或富交互界面

## 2. 命令入口

第一阶段固定支持两套等价入口：

完整命令：

```bash
foxpilot init
```

简写命令：

```bash
fp init
```

支持的等价扩展形式：

```bash
foxpilot init --path /absolute/path/to/project
foxpilot init --name <project-name>
foxpilot init --workspace-root <root-path>
foxpilot init --mode interactive
foxpilot init --mode non-interactive
foxpilot init --no-scan
```

```bash
fp init --path /absolute/path/to/project
fp init --name <project-name>
fp init --workspace-root <root-path>
fp init --mode interactive
fp init --mode non-interactive
fp init --no-scan
```

约定：

- `foxpilot` 与 `fp` 行为完全一致
- 帮助文档优先展示 `foxpilot init`
- 实际执行和测试必须同时验证 `fp init`

## 3. 输入参数清单

### 3.1 `--path`

含义：

- 指定要接管的项目根目录

规则：

- 必须是绝对路径或当前 shell 可解析路径
- 路径必须存在且是目录

默认值：

- 当前工作目录

示例：

```bash
foxpilot init --path /Users/program/code/foxpilot-workspace
```

等价写法：

```bash
fp init --path /Users/program/code/foxpilot-workspace
```

### 3.2 `--name`

含义：

- 指定项目名

规则：

- 只影响 FoxPilot 项目标识
- 不修改真实目录名

默认值：

- 目标目录 basename

示例：

```bash
foxpilot init --path /Users/program/code/foxpilot-workspace --name foxpilot
```

等价写法：

```bash
fp init --path /Users/program/code/foxpilot-workspace --name foxpilot
```

### 3.3 `--workspace-root`

含义：

- 指定项目归属的工作区根目录

规则：

- 必须是项目根目录的上层路径之一
- 若不满足包含关系，应直接报错

默认值：

- 已有全局配置命中的根目录
- 否则使用项目目录上一级

### 3.4 `--mode`

允许值：

- `interactive`
- `non-interactive`

默认值：

- `interactive`

原因：

- 第一阶段以安全接管优先
- 首次接管时更适合人工确认

### 3.5 `--no-scan`

含义：

- 不扫描子仓库

行为：

- 仅把目标目录本身视作一个项目
- 项目配置中的 `repositories` 只生成最小项

## 4. 输入场景

### 4.1 最小输入场景

用户输入：

```bash
foxpilot init
```

或：

```bash
fp init
```

命令自动推断：

- 项目根路径
- 项目名
- 工作区根目录
- 仓库候选列表

### 4.2 显式路径场景

用户输入：

```bash
foxpilot init --path /Users/program/code/demo-app
```

或：

```bash
fp init --path /Users/program/code/demo-app
```

命令只推断：

- 项目名
- 工作区根目录
- 仓库候选列表

### 4.3 非交互脚本场景

用户输入：

```bash
foxpilot init \
  --path /Users/program/code/demo-app \
  --name demo-app \
  --workspace-root /Users/program/code \
  --mode non-interactive
```

或：

```bash
fp init \
  --path /Users/program/code/demo-app \
  --name demo-app \
  --workspace-root /Users/program/code \
  --mode non-interactive
```

命令行为：

- 不再二次确认
- 直接写入配置和索引

## 5. 交互式问题清单

`interactive` 模式下，建议固定按以下顺序提问：

### 5.1 确认项目路径

提示语建议：

```text
项目根目录: /Users/program/code/foxpilot-workspace
是否使用这个目录初始化？ [Y/n]
```

### 5.2 确认项目名

提示语建议：

```text
项目名默认为 foxpilot-workspace，是否确认？ [Y/n]
```

若用户输入自定义值：

```text
请输入项目名:
```

### 5.3 确认工作区根目录

提示语建议：

```text
推断工作区根目录为 /Users/program/code，是否确认？ [Y/n]
```

### 5.4 确认仓库候选列表

提示语建议：

```text
识别到以下仓库候选:
1. root -> .
2. backend -> backend
3. frontend -> frontend
是否按该结果写入？ [Y/n]
```

### 5.5 最终确认

提示语建议：

```text
将生成项目配置并写入全局索引，是否继续？ [Y/n]
```

## 6. 标准输出清单

### 6.1 成功输出

成功时建议分 3 段输出：

#### 第一段：识别结果

```text
[FoxPilot] 初始化目标已确认
- projectRoot: /Users/program/code/foxpilot-workspace
- projectName: foxpilot-workspace
- workspaceRoot: /Users/program/code
- repositories: 1
```

#### 第二段：写入结果

```text
[FoxPilot] 已生成项目配置
- /Users/program/code/foxpilot-workspace/.foxpilot/project.json

[FoxPilot] 已确认全局配置
- /Users/zhouping/.foxpilot/foxpilot.config.json

[FoxPilot] 已确认全局数据库
- /Users/zhouping/.foxpilot/foxpilot.db
```

#### 第三段：索引结果

```text
[FoxPilot] 已写入项目索引
- workspace_root: upserted
- project: upserted
- repository: upserted(1)
```

### 6.2 成功结尾

建议固定输出：

```text
[FoxPilot] 初始化完成
后续可继续执行任务登记、项目扫描建议或桌面端接管流程。
```

## 7. 错误输出清单

### 7.1 路径不存在

```text
[FoxPilot] 初始化失败: 目标路径不存在
- path: /bad/path
```

退出码建议：

- `1`

### 7.2 路径不是目录

```text
[FoxPilot] 初始化失败: 目标路径不是目录
- path: /Users/program/code/file.txt
```

退出码建议：

- `1`

### 7.3 已初始化

```text
[FoxPilot] 初始化中止: 项目已存在配置
- /Users/program/code/foxpilot-workspace/.foxpilot/project.json
```

退出码建议：

- `2`

### 7.4 工作区根目录非法

```text
[FoxPilot] 初始化失败: workspace root 不包含项目路径
- workspaceRoot: /Users/program/demo
- projectRoot: /Users/program/code/foxpilot-workspace
```

退出码建议：

- `1`

### 7.5 全局配置解析失败

```text
[FoxPilot] 初始化失败: foxpilot.config.json 格式错误
- /Users/zhouping/.foxpilot/foxpilot.config.json
```

退出码建议：

- `3`

### 7.6 SQLite 初始化失败

```text
[FoxPilot] 初始化失败: foxpilot.db 初始化失败
- /Users/zhouping/.foxpilot/foxpilot.db
```

退出码建议：

- `4`

## 8. 输出文件清单

第一阶段 `foxpilot init` / `fp init` 成功后，至少应产生或确认以下文件：

### 8.1 项目内文件

- `<project-root>/.foxpilot/project.json`

### 8.2 全局文件

- `~/.foxpilot/foxpilot.config.json`
- `~/.foxpilot/foxpilot.db`

## 9. 写入数据库清单

第一阶段初始化阶段只允许写入以下表：

- `workspace_root`
- `project`
- `repository`

第一阶段初始化阶段不写入：

- `task`
- `task_target`
- `task_run`
- `project_config`

原因：

- `init` 只负责接管
- 任务与运行记录应由后续真实动作生成

## 10. 幂等性要求

第一阶段 `init` 需要尽量满足以下幂等性：

- 重复执行时不重复创建相同工作区根目录
- 重复执行时不重复创建相同项目
- 重复执行时不重复创建相同仓库

推荐语义：

- 文件侧：已存在则中止，不自动覆盖
- 数据库侧：按唯一键做 upsert 或逻辑等价处理

## 11. 当前结论

第一阶段 `foxpilot init` / `fp init` 的 CLI 契约已经可以收敛为：

- 少量参数
- 清晰交互
- 固定产物
- 明确错误码
- 只写接管索引，不写任务运行数据
- 完整命令与简写命令完全兼容

这足够支持下一步继续进入真正的命令实现计划。
