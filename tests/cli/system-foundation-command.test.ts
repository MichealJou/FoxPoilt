import { describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'

describe('foundation CLI', () => {
  it('prints foundation command usage', async () => {
    const result = await runCli(['foundation', '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot foundation')
  })

  it('prints foundation summary for the default pack', async () => {
    const result = await runCli(['foundation'], {
      dependencies: {
        runFoundationDoctor: async () => ({
          packId: 'default-foundation',
          items: [
            {
              tool: 'beads',
              status: 'ready',
              version: '1.0.0',
              checkTarget: 'bd',
            },
            {
              tool: 'superpowers',
              status: 'missing',
              version: null,
              checkTarget: '/Users/demo/.agents/skills/superpowers',
            },
          ],
          ready: ['beads'],
          missing: ['superpowers'],
        }),
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('default-foundation')
    expect(result.stdout).toContain('ready: beads')
    expect(result.stdout).toContain('missing: superpowers')
    expect(result.stdout).toContain('beads: ready')
    expect(result.stdout).toContain('superpowers: missing')
  })

  it('returns structured json foundation status when called with --json', async () => {
    const result = await runCli(['foundation', '--json'], {
      dependencies: {
        runFoundationDoctor: async () => ({
          packId: 'default-foundation',
          items: [
            {
              tool: 'beads',
              status: 'ready',
              version: '1.0.0',
              checkTarget: 'bd',
            },
          ],
          ready: ['beads'],
          missing: [],
        }),
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        packId: string
        ready: string[]
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('foundation')
    expect(payload.data.packId).toBe('default-foundation')
    expect(payload.data.ready).toEqual(['beads'])
  })
})
