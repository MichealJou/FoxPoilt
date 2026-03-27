# FoxPilot 第二阶段 CLI JSON 接口清单

## 1. 文档目的

第二阶段桌面端和 CLI 已经分离。

因此必须先把一件事说清楚：

> 哪些命令需要补 `--json`，以及返回结构大致长什么样。

这份文档只定义第二阶段脚本化接口第一批需要承接的 JSON 契约，不一次性覆盖全部 CLI。

## 2. 统一约束

### 2.1 调用形式

统一形式：

```bash
foxpilot <command> --json
```

或：

```bash
fp <command> --json
```

### 2.2 返回包络

建议统一包络：

```json
{
  "ok": true,
  "command": "task list",
  "timestamp": "2026-03-27T10:00:00.000Z",
  "data": {}
}
```

失败时：

```json
{
  "ok": false,
  "command": "task list",
  "timestamp": "2026-03-27T10:00:00.000Z",
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "未找到受管项目。",
    "details": {}
  }
}
```

### 2.3 设计原则

- 不让自动化脚本解析人类可读文本
- `data` 只放结构化字段
- `error.code` 保持稳定
- `message` 允许本地化

## 3. 第一批必须支持的命令

```text
install-info
foundation
init
task list
task show
task history
task doctor-beads
control-plane overview
platforms list
platforms inspect
platforms capabilities
platforms resolve
platforms doctor
skills list
skills inspect
skills doctor
skills repair
mcp list
mcp inspect
mcp doctor
mcp repair
mcp restart
```

其中：

- 工作流类命令的详细 JSON 草案继续放在本文件
- 中控类命令的详细 JSON 草案拆到：
  - `docs/specs/foxpilot-phase2-control-plane-json-contract.md`

## 4. 接口草案

### 4.1 `foxpilot install-info --json`

用途：

- 设置页
- 健康页
- 安装信息面板

返回建议：

```json
{
  "ok": true,
  "command": "install-info",
  "data": {
    "version": "0.1.4",
    "installMethod": "npm",
    "installPath": "/Users/xxx/.foxpilot/bin/foxpilot",
    "channel": "stable",
    "updatedAt": "2026-03-27T10:00:00.000Z"
  }
}
```

### 4.2 `foxpilot foundation --json`

用途：

- Foundation 状态页
- 初始化前环境检查

返回建议：

```json
{
  "ok": true,
  "command": "foundation",
  "data": {
    "packId": "default-foundation",
    "items": [
      {
        "tool": "beads",
        "status": "ready",
        "version": "1.0.0"
      },
      {
        "tool": "superpowers",
        "status": "missing",
        "version": null
      }
    ],
    "ready": ["beads"],
    "missing": ["superpowers"]
  }
}
```

### 4.3 `foxpilot init --json`

用途：

- Project Init Wizard

返回建议：

```json
{
  "ok": true,
  "command": "init",
  "data": {
    "projectId": "project:demo",
    "projectPath": "/Users/xxx/demo",
    "projectType": "node",
    "repositories": [
      {
        "id": "repo:web",
        "name": "web",
        "path": "apps/web"
      }
    ],
    "profile": {
      "selected": "default"
    },
    "orchestration": {
      "stages": ["analysis", "design", "implement", "verify"],
      "roles": {
        "design": "designer",
        "implement": "coder",
        "verify": "tester"
      },
      "platforms": {
        "design": {
          "recommended": "codex",
          "effective": "codex",
          "source": "auto-detect",
          "reasons": ["检测到 codex 可用", "design 阶段优先使用 codex"]
        },
        "implement": {
          "recommended": "claude_code",
          "effective": "claude_code",
          "source": "project-rule",
          "reasons": ["检测到 claude code 可用", "implement 阶段优先使用 claude_code"]
        }
      }
    }
  }
}
```

### 4.4 `foxpilot task list --json`

用途：

- 任务中心
- Dashboard 任务摘要

返回建议：

```json
{
  "ok": true,
  "command": "task list",
  "data": {
    "items": [
      {
        "taskId": "task:1",
        "title": "同步 Beads 任务",
        "source": "beads",
        "status": "analyzing",
        "priority": "high",
        "stage": "implement",
        "role": "coder",
        "platform": "claude_code",
        "repository": "web",
        "updatedAt": "2026-03-27T10:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

### 4.5 `foxpilot task show --json`

用途：

- 任务详情页
- 右侧上下文面板

返回建议：

```json
{
  "ok": true,
  "command": "task show",
  "data": {
    "task": {
      "taskId": "task:1",
      "title": "同步 Beads 任务",
      "description": "……",
      "source": "beads",
      "status": "analyzing",
      "priority": "high",
      "stage": "implement",
      "role": "coder",
      "platform": "claude_code"
    },
    "targets": [
      {
        "repository": "web",
        "path": "apps/web"
      }
    ]
  }
}
```

### 4.6 `foxpilot task history --json`

用途：

- 运行历史
- 任务详情页中的历史区块

返回建议：

```json
{
  "ok": true,
  "command": "task history",
  "data": {
    "taskId": "task:1",
    "runs": [
      {
        "runId": "run:1",
        "kind": "analysis",
        "status": "success",
        "startedAt": "2026-03-27T09:00:00.000Z",
        "finishedAt": "2026-03-27T09:05:00.000Z"
      }
    ]
  }
}
```

### 4.7 `foxpilot task doctor-beads --json`

用途：

- 环境健康页
- 仓库健康面板

返回建议：

```json
{
  "ok": true,
  "command": "task doctor-beads",
  "data": {
    "repository": "web",
    "status": "warning",
    "checks": [
      {
        "name": "beads cli",
        "status": "ready"
      },
      {
        "name": "hooks",
        "status": "missing"
      }
    ]
  }
}
```

## 5. 第二批可补命令

第二阶段第一批不需要全部覆盖，但后续建议补：

```text
task sync-beads --json
task diff-beads --json
task beads-summary --json
task update-status --json
task update-priority --json
task update-executor --json
task import-beads --json
platforms detect --json
skills install --json
skills uninstall --json
skills enable --json
skills disable --json
mcp add --json
mcp remove --json
mcp enable --json
mcp disable --json
```

## 6. 错误码建议

建议第二阶段优先稳定这些错误码：

```text
PROJECT_NOT_FOUND
REPOSITORY_NOT_FOUND
TASK_NOT_FOUND
INVALID_PROFILE
EXECUTOR_NOT_AVAILABLE
FOUNDATION_NOT_READY
BEADS_NOT_READY
COMMAND_FAILED
```

## 7. 当前结论

第二阶段里，`CLI --json` 的正确定位是：

- 脚本化接口
- 自动化接口
- 调试与测试接口

Desktop 正式通道应走 `Runtime Core`，而不是把 `CLI --json` 当成唯一宿主。

中控详细契约见：

- `docs/specs/foxpilot-phase2-control-plane-json-contract.md`
