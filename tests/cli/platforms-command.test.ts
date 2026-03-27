import { describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'

const platformItems = [
  {
    id: 'codex',
    kind: 'platform',
    platformId: 'codex',
    name: 'Codex',
    source: 'auto-detect',
    status: 'ready',
    healthSummary: null,
    lastCheckedAt: '2026-03-27T00:00:00.000Z',
    availableActions: ['inspect', 'doctor', 'capabilities', 'resolve'],
    version: '1.2.0',
    command: 'codex',
    capabilities: ['design'],
    supportedStages: ['design'],
    recommendedRoles: ['designer'],
    detectReasons: ['检测到 codex CLI'],
  },
] as const

describe('platforms CLI', () => {
  it('lists platforms in json mode', async () => {
    const result = await runCli(['platforms', 'list', '--json'], {
      dependencies: {
        collectPlatformRegistry: async () => [...platformItems],
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        total: number
        items: Array<{ platformId: string }>
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('platforms list')
    expect(payload.data.total).toBe(1)
    expect(payload.data.items[0]?.platformId).toBe('codex')
  })

  it('inspects a single platform in json mode', async () => {
    const result = await runCli(['platforms', 'inspect', '--platform', 'codex', '--json'], {
      dependencies: {
        collectPlatformRegistry: async () => [...platformItems],
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        platform: { platformId: string; version: string | null }
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('platforms inspect')
    expect(payload.data.platform.platformId).toBe('codex')
    expect(payload.data.platform.version).toBe('1.2.0')
  })

  it('returns capabilities for a single platform in json mode', async () => {
    const result = await runCli(['platforms', 'capabilities', '--platform', 'codex', '--json'], {
      dependencies: {
        collectPlatformRegistry: async () => [...platformItems],
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        platformId: string
        capabilities: Array<{ name: string }>
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('platforms capabilities')
    expect(payload.data.platformId).toBe('codex')
    expect(payload.data.capabilities[0]?.name).toBe('design')
  })

  it('returns doctor summary for platforms in json mode', async () => {
    const result = await runCli(['platforms', 'doctor', '--json'], {
      dependencies: {
        collectPlatformRegistry: async () => [...platformItems],
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
    expect(payload.command).toBe('platforms doctor')
    expect(payload.data.summary.ready).toBe(1)
    expect(payload.data.summary.degraded).toBe(0)
    expect(payload.data.summary.unavailable).toBe(0)
  })
})
