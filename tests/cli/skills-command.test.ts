import { describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'

const skillItems = [
  {
    id: 'architecture-designer',
    kind: 'skill',
    skillId: 'architecture-designer',
    name: 'architecture-designer',
    source: 'agents',
    status: 'ready',
    healthSummary: null,
    lastCheckedAt: '2026-03-27T00:00:00.000Z',
    availableActions: ['inspect', 'doctor'],
    version: '0.1.0',
    installPath: '/tmp/architecture-designer-0.1.0',
    manifestPath: '/tmp/architecture-designer-0.1.0/SKILL.md',
    enabled: true,
  },
] as const

describe('skills CLI', () => {
  it('lists skills in json mode', async () => {
    const result = await runCli(['skills', 'list', '--json'], {
      dependencies: {
        collectSkillRegistry: async () => [...skillItems],
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        total: number
        items: Array<{ skillId: string }>
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('skills list')
    expect(payload.data.total).toBe(1)
    expect(payload.data.items[0]?.skillId).toBe('architecture-designer')
  })

  it('inspects a single skill in json mode', async () => {
    const result = await runCli(
      ['skills', 'inspect', '--skill', 'architecture-designer', '--json'],
      {
        dependencies: {
          collectSkillRegistry: async () => [...skillItems],
        },
      },
    )

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        skill: { skillId: string; version: string | null }
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('skills inspect')
    expect(payload.data.skill.skillId).toBe('architecture-designer')
    expect(payload.data.skill.version).toBe('0.1.0')
  })

  it('returns doctor summary for skills in json mode', async () => {
    const result = await runCli(['skills', 'doctor', '--json'], {
      dependencies: {
        collectSkillRegistry: async () => [...skillItems],
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
    expect(payload.command).toBe('skills doctor')
    expect(payload.data.summary.ready).toBe(1)
    expect(payload.data.summary.degraded).toBe(0)
    expect(payload.data.summary.unavailable).toBe(0)
  })
})
