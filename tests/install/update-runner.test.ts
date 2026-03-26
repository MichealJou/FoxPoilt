import { describe, expect, it } from 'vitest'

describe('update runner', () => {
  it('builds the npm update command', async () => {
    const { runNpmUpdate } = await import('@/install/update-runner.js')

    const calls: Array<{ command: string; args: string[] }> = []
    const result = await runNpmUpdate(
      {
        installMethod: 'npm',
        updateTarget: {
          npmPackage: 'foxpilot',
        },
      } as never,
      {
        runCommand: async (command, args) => {
          calls.push({ command, args })
          return { exitCode: 0, stdout: 'ok', stderr: '' }
        },
      },
    )

    expect(calls).toEqual([
      {
        command: 'npm',
        args: ['install', '-g', 'foxpilot@latest'],
      },
    ])
    expect(result).toContain('strategy: npm')
  })

  it('builds the brew update command', async () => {
    const { runBrewUpdate } = await import('@/install/update-runner.js')

    const calls: Array<{ command: string; args: string[] }> = []
    const result = await runBrewUpdate(
      {
        installMethod: 'brew',
        updateTarget: {
          brewFormula: 'foxpilot',
        },
      } as never,
      {
        runCommand: async (command, args) => {
          calls.push({ command, args })
          return { exitCode: 0, stdout: 'ok', stderr: '' }
        },
      },
    )

    expect(calls).toEqual([
      {
        command: 'brew',
        args: ['upgrade', 'foxpilot'],
      },
    ])
    expect(result).toContain('strategy: brew')
  })

  it('builds the unix release update command', async () => {
    const { runReleaseUpdate } = await import('@/install/update-runner.js')

    const calls: Array<{ command: string; args: string[] }> = []
    const result = await runReleaseUpdate(
      {
        installMethod: 'release',
        installRoot: '/tmp/foxpilot-release',
      } as never,
      {
        platform: 'linux',
        runCommand: async (command, args) => {
          calls.push({ command, args })
          return { exitCode: 0, stdout: 'ok', stderr: '' }
        },
      },
    )

    expect(calls).toEqual([
      {
        command: 'sh',
        args: ['/tmp/foxpilot-release/scripts/install.sh', '--version', 'latest'],
      },
    ])
    expect(result).toContain('strategy: release')
  })
})
