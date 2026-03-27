import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FoundationSetupResult } from '@/foundation/foundation-installer.js'
import type { InstallManifest } from '@/install/install-types.js'

describe('postinstall integration', () => {
  afterEach(() => {
    delete process.env.INIT_CWD
    vi.restoreAllMocks()
  })

  it('runs foundation setup during install flow', async () => {
    const { runPostinstall } = await import('@/install/postinstall.js')

    const registerCurrentInstallation = vi.fn(async () => ({
      manifest: {
        schemaVersion: 1,
        installMethod: 'npm',
        packageName: 'foxpilot',
        packageVersion: '0.1.4',
        channel: 'stable',
        platform: process.platform,
        arch: process.arch,
        installRoot: '/tmp/global-install',
        binPath: '/tmp/global-install/dist/cli/run.js',
        updateTarget: {
          npmPackage: 'foxpilot',
        },
        installedAt: '2026-03-27T00:00:00.000Z',
        updatedAt: '2026-03-27T00:00:00.000Z',
      } satisfies InstallManifest,
      manifestPath: '/tmp/global-install/install-manifest.json',
      indexPath: '/Users/demo/.foxpilot/installations.json',
    }))
    const readPackageMetadata = vi.fn(async () => ({
      name: 'foxpilot',
      version: '0.1.4',
    }))
    const setupFoundationPack = vi.fn(async (): Promise<FoundationSetupResult> => ({
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
          status: 'ready',
          version: null,
          checkTarget: '/Users/demo/.agents/skills/superpowers',
        },
      ],
      ready: ['beads', 'superpowers'],
      missing: [],
      installed: [],
    }))

    const output: string[] = []
    const write = vi.fn((chunk: string | Uint8Array) => {
      output.push(String(chunk))
      return true
    })

    await runPostinstall({
      cwd: '/tmp/global-install',
      homeDir: '/Users/demo',
      executablePath: '/tmp/global-install/dist/cli/run.js',
      registerCurrentInstallation,
      readPackageMetadata,
      setupFoundationPack,
      stdout: {
        write,
      },
    })

    expect(registerCurrentInstallation).toHaveBeenCalledTimes(1)
    expect(setupFoundationPack).toHaveBeenCalledWith({
      homeDir: '/Users/demo',
      platform: process.platform,
    })
    expect(output.join('')).toContain('foundationPack: beads, superpowers')
  })
})
