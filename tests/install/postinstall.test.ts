import { afterEach, describe, expect, it, vi } from 'vitest'

import type { FoundationSetupResult } from '@foxpilot/integrations/foundation/foundation-installer.js'
import type { InstallManifest } from '@foxpilot/infra/install/install-types.js'

describe('postinstall integration', () => {
  afterEach(() => {
    delete process.env.INIT_CWD
    delete process.env.FOXPILOT_SKIP_FOUNDATION_PACK
    vi.restoreAllMocks()
  })

  it('runs foundation setup during install flow', async () => {
    const { runPostinstall } = await import('@foxpilot/infra/install/postinstall.js')

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
        binPath: '/tmp/global-install/dist/apps/cli/src/cli/run.js',
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
    const setupFoundationPack = vi.fn(
      async (): Promise<FoundationSetupResult> => ({
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
      }),
    )

    const output: string[] = []
    const write = vi.fn((chunk: string | Uint8Array) => {
      output.push(String(chunk))
      return true
    })

    await runPostinstall({
      cwd: '/tmp/global-install',
      packageRoot: '/tmp/global-install',
      homeDir: '/Users/demo',
      executablePath: '/tmp/global-install/dist/apps/cli/src/cli/run.js',
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

  it('does not skip consumer install when INIT_CWD equals consumer root but package root differs', async () => {
    process.env.INIT_CWD = '/tmp/consumer-root'
    const { runPostinstall } = await import('@foxpilot/infra/install/postinstall.js')

    const registerCurrentInstallation = vi.fn(async () => ({
      manifest: {
        schemaVersion: 1,
        installMethod: 'npm',
        packageName: 'foxpilot',
        packageVersion: '0.1.4',
        channel: 'stable',
        platform: process.platform,
        arch: process.arch,
        installRoot: '/tmp/consumer-root/node_modules/foxpilot',
        binPath: '/tmp/consumer-root/node_modules/foxpilot/dist/apps/cli/src/cli/run.js',
        updateTarget: {
          npmPackage: 'foxpilot',
        },
        installedAt: '2026-03-27T00:00:00.000Z',
        updatedAt: '2026-03-27T00:00:00.000Z',
      } satisfies InstallManifest,
      manifestPath: '/tmp/consumer-root/node_modules/foxpilot/install-manifest.json',
      indexPath: '/Users/demo/.foxpilot/installations.json',
    }))
    const readPackageMetadata = vi.fn(async () => ({
      name: 'foxpilot',
      version: '0.1.4',
    }))
    const setupFoundationPack = vi.fn(
      async (): Promise<FoundationSetupResult> => ({
        packId: 'default-foundation',
        items: [],
        ready: [],
        missing: [],
        installed: [],
      }),
    )

    await runPostinstall({
      cwd: '/tmp/consumer-root',
      packageRoot: '/tmp/consumer-root/node_modules/foxpilot',
      homeDir: '/Users/demo',
      registerCurrentInstallation,
      readPackageMetadata,
      setupFoundationPack,
      stdout: {
        write: () => true,
      },
    })

    expect(registerCurrentInstallation).toHaveBeenCalledTimes(1)
    expect(registerCurrentInstallation).toHaveBeenCalledWith(
      expect.objectContaining({
        installRoot: '/tmp/consumer-root/node_modules/foxpilot',
        executablePath: '/tmp/consumer-root/node_modules/foxpilot/dist/apps/cli/src/cli/run.js',
      }),
    )
  })

  it('skips foundation setup when FOXPILOT_SKIP_FOUNDATION_PACK=1', async () => {
    process.env.FOXPILOT_SKIP_FOUNDATION_PACK = '1'
    const { runPostinstall } = await import('@foxpilot/infra/install/postinstall.js')

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
        binPath: '/tmp/global-install/dist/apps/cli/src/cli/run.js',
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
    const setupFoundationPack = vi.fn(
      async (): Promise<FoundationSetupResult> => ({
        packId: 'default-foundation',
        items: [],
        ready: [],
        missing: [],
        installed: [],
      }),
    )

    const output: string[] = []
    const write = vi.fn((chunk: string | Uint8Array) => {
      output.push(String(chunk))
      return true
    })

    await runPostinstall({
      cwd: '/tmp/global-install',
      packageRoot: '/tmp/global-install',
      homeDir: '/Users/demo',
      executablePath: '/tmp/global-install/dist/apps/cli/src/cli/run.js',
      registerCurrentInstallation,
      readPackageMetadata,
      setupFoundationPack,
      stdout: {
        write,
      },
    })

    expect(registerCurrentInstallation).toHaveBeenCalledTimes(1)
    expect(setupFoundationPack).not.toHaveBeenCalled()
    expect(output.join('')).toContain('skipped: true')
  })
})
