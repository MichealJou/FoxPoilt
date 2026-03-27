import { describe, expect, it } from 'vitest'

describe('uninstall runner', () => {
  it('builds the npm uninstall command', async () => {
    const { runNpmUninstall } = await import('@foxpilot/infra/install/uninstall-runner.js')

    const calls: Array<{ command: string; args: string[] }> = []
    const pathCleanupCalls: Array<{ homeDir: string; binDir: string }> = []
    const result = await runNpmUninstall(
      {
        installMethod: 'npm',
        packageName: 'foxpilot',
        installRoot: '/usr/local/lib/node_modules/foxpilot',
        updateTarget: {
          npmPackage: 'foxpilot',
        },
      } as never,
      {
        platform: 'darwin',
        homeDir: '/Users/tester',
        runCommand: async (command, args) => {
          calls.push({ command, args })
          return { exitCode: 0, stdout: 'ok', stderr: '' }
        },
        removeUnixShellPath: async ({ homeDir, binDir }) => {
          pathCleanupCalls.push({ homeDir, binDir })
          return { updatedProfiles: ['/Users/tester/.zshrc'] }
        },
      },
    )

    expect(calls).toEqual([
      {
        command: 'npm',
        args: ['uninstall', '-g', 'foxpilot'],
      },
    ])
    expect(pathCleanupCalls).toEqual([
      {
        homeDir: '/Users/tester',
        binDir: '/usr/local/bin',
      },
    ])
    expect(result).toContain('strategy: npm')
    expect(result).toContain('pathCleanupProfiles: 1')
  })

  it('builds the brew uninstall command', async () => {
    const { runBrewUninstall } = await import('@foxpilot/infra/install/uninstall-runner.js')

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
    const { runReleaseUninstall } = await import('@foxpilot/infra/install/uninstall-runner.js')

    const removedPaths: string[] = []
    const pathCleanupCalls: Array<{ homeDir: string; binDir: string }> = []
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
        removeUnixShellPath: async ({ homeDir, binDir }) => {
          pathCleanupCalls.push({ homeDir, binDir })
          return { updatedProfiles: ['/Users/tester/.zshrc'] }
        },
      },
    )

    expect(removedPaths).toEqual([
      '/Users/tester/.foxpilot/bin/foxpilot',
      '/Users/tester/.foxpilot/bin/fp',
      '/Users/tester/.foxpilot/release/current',
    ])
    expect(pathCleanupCalls).toEqual([
      {
        homeDir: '/Users/tester',
        binDir: '/Users/tester/.foxpilot/bin',
      },
    ])
    expect(result).toContain('strategy: release')
    expect(result).toContain('pathCleanupProfiles: 1')
  })

  it('removes the Windows user PATH entry for npm installs', async () => {
    const { runNpmUninstall } = await import('@foxpilot/infra/install/uninstall-runner.js')

    const removedEntries: string[] = []
    const result = await runNpmUninstall(
      {
        installMethod: 'npm',
        packageName: 'foxpilot',
        installRoot: 'C:\\Users\\tester\\AppData\\Roaming\\npm\\node_modules\\foxpilot',
        updateTarget: {
          npmPackage: 'foxpilot',
        },
      } as never,
      {
        platform: 'win32',
        homeDir: 'C:\\Users\\tester',
        runCommand: async () => ({ exitCode: 0, stdout: 'ok', stderr: '' }),
        removeWindowsPathEntry: async (targetPath) => {
          removedEntries.push(targetPath)
        },
      },
    )

    expect(removedEntries).toEqual([
      'C:\\Users\\tester\\AppData\\Roaming\\npm',
    ])
    expect(result).toContain('pathCleanupUserEntry: true')
  })
})
