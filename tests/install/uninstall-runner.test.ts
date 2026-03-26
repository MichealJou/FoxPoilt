import { describe, expect, it } from 'vitest'

describe('uninstall runner', () => {
  it('builds the npm uninstall command', async () => {
    const { runNpmUninstall } = await import('@/install/uninstall-runner.js')

    const calls: Array<{ command: string; args: string[] }> = []
    const result = await runNpmUninstall(
      {
        installMethod: 'npm',
        packageName: 'foxpilot',
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
        args: ['uninstall', '-g', 'foxpilot'],
      },
    ])
    expect(result).toContain('strategy: npm')
  })

  it('builds the brew uninstall command', async () => {
    const { runBrewUninstall } = await import('@/install/uninstall-runner.js')

    const calls: Array<{ command: string; args: string[] }> = []
    const result = await runBrewUninstall(
      {
        installMethod: 'brew',
        packageName: 'foxpilot',
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
        args: ['uninstall', 'foxpilot'],
      },
    ])
    expect(result).toContain('strategy: brew')
  })

  it('removes release install files and default command shims', async () => {
    const { runReleaseUninstall } = await import('@/install/uninstall-runner.js')

    const removedPaths: string[] = []
    const result = await runReleaseUninstall(
      {
        installMethod: 'release',
        installRoot: '/Users/tester/.foxpilot/release/current',
      } as never,
      {
        platform: 'darwin',
        homeDir: '/Users/tester',
        removePath: async (targetPath) => {
          removedPaths.push(targetPath)
        },
      },
    )

    expect(removedPaths).toEqual([
      '/Users/tester/.foxpilot/bin/foxpilot',
      '/Users/tester/.foxpilot/bin/fp',
      '/Users/tester/.foxpilot/release/current',
    ])
    expect(result).toContain('strategy: release')
  })
})
