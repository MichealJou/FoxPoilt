import { describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'

const mcpItems = [
  {
    id: 'github',
    kind: 'mcp',
    serverId: 'github',
    name: 'github',
    source: 'codex-config',
    status: 'ready',
    healthSummary: 'MCP 配置已识别',
    lastCheckedAt: '2026-03-27T00:00:00.000Z',
    availableActions: ['inspect', 'doctor', 'repair', 'restart'],
    configPath: '/tmp/.codex/config.toml',
    command: null,
    args: [],
    enabled: true,
    transport: 'http',
    url: 'https://api.githubcopilot.com/mcp/',
    envSummary: null,
  },
] as const

describe('mcp CLI', () => {
  it('lists mcp servers in json mode', async () => {
    const result = await runCli(['mcp', 'list', '--json'], {
      dependencies: {
        collectMcpRegistry: async () => [...mcpItems],
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        total: number
        items: Array<{ serverId: string }>
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('mcp list')
    expect(payload.data.total).toBe(1)
    expect(payload.data.items[0]?.serverId).toBe('github')
  })

  it('inspects a single mcp server in json mode', async () => {
    const result = await runCli(['mcp', 'inspect', '--server', 'github', '--json'], {
      dependencies: {
        collectMcpRegistry: async () => [...mcpItems],
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        server: { serverId: string; transport: string }
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('mcp inspect')
    expect(payload.data.server.serverId).toBe('github')
    expect(payload.data.server.transport).toBe('http')
  })

  it('returns doctor summary for mcp in json mode', async () => {
    const result = await runCli(['mcp', 'doctor', '--json'], {
      dependencies: {
        collectMcpRegistry: async () => [...mcpItems],
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        summary: { ready: number; degraded: number; unavailable: number }
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('mcp doctor')
    expect(payload.data.summary.ready).toBe(1)
    expect(payload.data.summary.degraded).toBe(0)
    expect(payload.data.summary.unavailable).toBe(0)
  })
})
