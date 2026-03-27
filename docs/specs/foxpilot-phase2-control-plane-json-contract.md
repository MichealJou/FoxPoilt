# FoxPilot 第二阶段中控 JSON 返回结构

## 1. 文档目的

这份文档只定义第二阶段中控平台相关命令的 JSON 契约。

重点覆盖：

- `controlPlane.overview`
- `platform.*`
- `skill.*`
- `mcp.*`

它和总的 CLI JSON 契约文档配合使用：

- 总文档负责统一包络与通用原则
- 这份文档负责中控对象的详细结构

## 2. 统一原则

所有中控命令统一支持：

```bash
foxpilot <command> --json
fp <command> --json
```

统一包络延续总文档约定：

```json
{
  "ok": true,
  "command": "platforms list",
  "timestamp": "2026-03-27T10:00:00.000Z",
  "data": {}
}
```

失败时：

```json
{
  "ok": false,
  "command": "platforms inspect",
  "timestamp": "2026-03-27T10:00:00.000Z",
  "error": {
    "code": "PLATFORM_NOT_FOUND",
    "message": "未找到指定平台。",
    "details": {
      "platformId": "codex"
    }
  }
}
```

## 3. 第一批必须支持的中控 JSON 命令

```text
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

## 4. `foxpilot control-plane overview --json`

用途：

- Control Plane 首页
- Dashboard 中控摘要卡片

返回建议：

```json
{
  "ok": true,
  "command": "control-plane overview",
  "data": {
    "summary": {
      "platformCount": 4,
      "skillCount": 18,
      "mcpCount": 7,
      "readyCount": 24,
      "degradedCount": 3,
      "unavailableCount": 2
    },
    "recentChecks": {
      "platformDetectAt": "2026-03-27T10:00:00.000Z",
      "platformDoctorAt": "2026-03-27T10:01:00.000Z",
      "skillDoctorAt": "2026-03-27T10:02:00.000Z",
      "mcpDoctorAt": "2026-03-27T10:03:00.000Z"
    },
    "highlights": {
      "degradedPlatforms": ["claude_code"],
      "unavailableMcpServers": ["mysql-lsk"],
      "repairCandidates": [
        {
          "kind": "skill",
          "id": "architecture-designer",
          "reason": "manifest 缺失"
        }
      ]
    }
  }
}
```

## 5. Platforms JSON 契约

### 5.1 `foxpilot platforms list --json`

```json
{
  "ok": true,
  "command": "platforms list",
  "data": {
    "items": [
      {
        "id": "codex",
        "kind": "platform",
        "name": "Codex",
        "status": "ready",
        "healthSummary": null,
        "lastCheckedAt": "2026-03-27T10:00:00.000Z",
        "availableActions": ["inspect", "doctor", "capabilities", "resolve"],
        "version": "1.2.0",
        "capabilities": ["design", "review", "document"],
        "supportedStages": ["analysis", "design", "review"],
        "recommendedRoles": ["designer", "reviewer"],
        "detectReasons": ["检测到 codex CLI", "版本满足最低要求"]
      }
    ],
    "total": 1
  }
}
```

### 5.2 `foxpilot platforms inspect --platform codex --json`

```json
{
  "ok": true,
  "command": "platforms inspect",
  "data": {
    "platform": {
      "id": "codex",
      "kind": "platform",
      "name": "Codex",
      "status": "ready",
      "version": "1.2.0",
      "capabilities": ["design", "review", "document"],
      "supportedStages": ["analysis", "design", "review"],
      "recommendedRoles": ["designer", "reviewer"],
      "detectReasons": ["检测到 codex CLI", "版本满足最低要求"],
      "healthSummary": null,
      "lastCheckedAt": "2026-03-27T10:00:00.000Z",
      "availableActions": ["doctor", "capabilities", "resolve"]
    }
  }
}
```

### 5.3 `foxpilot platforms capabilities --platform codex --json`

```json
{
  "ok": true,
  "command": "platforms capabilities",
  "data": {
    "platformId": "codex",
    "capabilities": [
      {
        "name": "design",
        "supportedStages": ["analysis", "design"],
        "supportedRoles": ["designer"]
      },
      {
        "name": "review",
        "supportedStages": ["review"],
        "supportedRoles": ["reviewer"]
      }
    ]
  }
}
```

### 5.4 `foxpilot platforms resolve --project <id> --json`

```json
{
  "ok": true,
  "command": "platforms resolve",
  "data": {
    "projectId": "project:demo",
    "stages": [
      {
        "stage": "design",
        "role": "designer",
        "recommendedPlatform": "codex",
        "effectivePlatform": "codex",
        "source": "auto-detect",
        "reasons": ["design 阶段优先 codex"]
      },
      {
        "stage": "implement",
        "role": "coder",
        "recommendedPlatform": "claude_code",
        "effectivePlatform": "claude_code",
        "source": "project-rule",
        "reasons": ["实现阶段优先 claude_code"]
      }
    ]
  }
}
```

### 5.5 `foxpilot platforms doctor --json`

```json
{
  "ok": true,
  "command": "platforms doctor",
  "data": {
    "summary": {
      "ready": 3,
      "degraded": 1,
      "unavailable": 0
    },
    "items": [
      {
        "platformId": "claude_code",
        "status": "degraded",
        "issues": ["版本低于推荐值"],
        "suggestedActions": ["inspect", "repair"]
      }
    ]
  }
}
```

## 6. Skills JSON 契约

### 6.1 `foxpilot skills list --json`

```json
{
  "ok": true,
  "command": "skills list",
  "data": {
    "items": [
      {
        "id": "architecture-designer",
        "kind": "skill",
        "name": "architecture-designer",
        "source": "local",
        "status": "ready",
        "healthSummary": null,
        "lastCheckedAt": "2026-03-27T10:00:00.000Z",
        "availableActions": ["inspect", "disable", "doctor"],
        "version": "0.1.0",
        "installPath": "/Users/xxx/.agents/skills/architecture-designer",
        "manifestPath": "/Users/xxx/.agents/skills/architecture-designer/SKILL.md",
        "enabled": true
      }
    ],
    "total": 1
  }
}
```

### 6.2 `foxpilot skills inspect --skill architecture-designer --json`

```json
{
  "ok": true,
  "command": "skills inspect",
  "data": {
    "skill": {
      "id": "architecture-designer",
      "kind": "skill",
      "name": "architecture-designer",
      "status": "ready",
      "enabled": true,
      "version": "0.1.0",
      "source": "local",
      "installPath": "/Users/xxx/.agents/skills/architecture-designer",
      "manifestPath": "/Users/xxx/.agents/skills/architecture-designer/SKILL.md",
      "healthSummary": null,
      "lastCheckedAt": "2026-03-27T10:00:00.000Z",
      "availableActions": ["disable", "doctor", "repair"]
    }
  }
}
```

### 6.3 `foxpilot skills doctor --json`

```json
{
  "ok": true,
  "command": "skills doctor",
  "data": {
    "summary": {
      "ready": 17,
      "degraded": 1,
      "unavailable": 0
    },
    "items": [
      {
        "skillId": "foo-skill",
        "status": "degraded",
        "issues": ["缺少 manifest"],
        "suggestedActions": ["inspect", "repair"]
      }
    ]
  }
}
```

### 6.4 `foxpilot skills repair --skill foo-skill --json`

```json
{
  "ok": true,
  "command": "skills repair",
  "data": {
    "skillId": "foo-skill",
    "changed": true,
    "beforeStatus": "degraded",
    "afterStatus": "ready",
    "operations": ["rebuild-manifest"],
    "followUpActions": ["inspect", "doctor"]
  }
}
```

## 7. MCP JSON 契约

### 7.1 `foxpilot mcp list --json`

```json
{
  "ok": true,
  "command": "mcp list",
  "data": {
    "items": [
      {
        "id": "mysql_lsk",
        "kind": "mcp",
        "name": "mysql_lsk",
        "source": "config",
        "status": "ready",
        "healthSummary": null,
        "lastCheckedAt": "2026-03-27T10:00:00.000Z",
        "availableActions": ["inspect", "disable", "doctor", "restart"],
        "configPath": "/Users/xxx/.config/foxpilot/mcp/mysql_lsk.json",
        "command": "node",
        "args": ["server.js"],
        "enabled": true
      }
    ],
    "total": 1
  }
}
```

### 7.2 `foxpilot mcp inspect --server mysql_lsk --json`

```json
{
  "ok": true,
  "command": "mcp inspect",
  "data": {
    "server": {
      "id": "mysql_lsk",
      "kind": "mcp",
      "name": "mysql_lsk",
      "status": "ready",
      "enabled": true,
      "command": "node",
      "args": ["server.js"],
      "configPath": "/Users/xxx/.config/foxpilot/mcp/mysql_lsk.json",
      "healthSummary": null,
      "lastCheckedAt": "2026-03-27T10:00:00.000Z",
      "availableActions": ["disable", "doctor", "repair", "restart"],
      "recentError": null
    }
  }
}
```

### 7.3 `foxpilot mcp doctor --json`

```json
{
  "ok": true,
  "command": "mcp doctor",
  "data": {
    "summary": {
      "ready": 6,
      "degraded": 1,
      "unavailable": 0
    },
    "items": [
      {
        "serverId": "mysql_lsk",
        "status": "degraded",
        "issues": ["最近一次启动超时"],
        "suggestedActions": ["inspect", "restart", "repair"]
      }
    ]
  }
}
```

### 7.4 `foxpilot mcp repair --server mysql_lsk --json`

```json
{
  "ok": true,
  "command": "mcp repair",
  "data": {
    "serverId": "mysql_lsk",
    "changed": true,
    "beforeStatus": "degraded",
    "afterStatus": "ready",
    "operations": ["rewrite-config", "refresh-process-state"],
    "followUpActions": ["inspect", "doctor"]
  }
}
```

### 7.5 `foxpilot mcp restart --server mysql_lsk --json`

```json
{
  "ok": true,
  "command": "mcp restart",
  "data": {
    "serverId": "mysql_lsk",
    "changed": true,
    "beforeStatus": "degraded",
    "afterStatus": "ready",
    "restartedAt": "2026-03-27T10:10:00.000Z",
    "followUpActions": ["inspect"]
  }
}
```

## 8. 错误码建议

中控对象建议至少稳定这些错误码：

```text
CONTROL_PLANE_UNAVAILABLE
PLATFORM_NOT_FOUND
PLATFORM_DETECT_FAILED
SKILL_NOT_FOUND
SKILL_REPAIR_FAILED
MCP_SERVER_NOT_FOUND
MCP_RESTART_FAILED
PROJECT_RESOLVE_FAILED
```

## 9. 与注册表模型的关系

这份 JSON 契约应该尽量复用注册表模型字段，不要再重新造一套名字。

也就是说：

- `platforms list --json` 直接返回平台注册项数组
- `skills list --json` 直接返回技能注册项数组
- `mcp list --json` 直接返回 MCP 注册项数组
- `control-plane overview --json` 返回聚合摘要和异常对象引用

## 10. 审核点

你审核这份契约时，重点看：

```text
1  是否接受 control-plane overview 作为中控首页正式 JSON 入口
2  是否接受 list / inspect 复用注册表字段，而不是另起字段体系
3  是否接受 doctor / repair / restart 返回 changed / before / after / followUpActions
4  是否接受第一批中控 JSON 先覆盖 Platforms / Skills / MCP 的读和健康主链
```
