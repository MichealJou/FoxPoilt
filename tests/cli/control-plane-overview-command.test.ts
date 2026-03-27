import { describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'

describe('control-plane overview CLI', () => {
  it('returns structured json overview output', async () => {
    const result = await runCli(['control-plane', 'overview', '--json'], {
      dependencies: {
        collectControlPlaneOverview: async () => ({
          summary: {
            platformCount: 4,
            skillCount: 18,
            mcpCount: 7,
            readyCount: 24,
            degradedCount: 3,
            unavailableCount: 2,
          },
          recentChecks: {
            platformDetectAt: '2026-03-27T00:00:00.000Z',
            skillDoctorAt: '2026-03-27T00:00:00.000Z',
            mcpDoctorAt: '2026-03-27T00:00:00.000Z',
          },
          highlights: {
            degradedPlatforms: ['claude_code'],
            degradedSkills: ['superpowers'],
            unavailableMcpServers: ['mysql-lsk'],
          },
        }),
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        summary: {
          platformCount: number
          skillCount: number
          mcpCount: number
        }
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('control-plane overview')
    expect(payload.data.summary.platformCount).toBe(4)
    expect(payload.data.summary.skillCount).toBe(18)
    expect(payload.data.summary.mcpCount).toBe(7)
  })
})
