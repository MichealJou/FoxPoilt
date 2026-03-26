import { describe, expect, it } from 'vitest'

describe('update dispatcher', () => {
  it('maps npm manifests to the npm update branch', async () => {
    const { dispatchUpdate } = await import('@/install/update-dispatcher.js')

    const result = await dispatchUpdate(
      {
        installMethod: 'npm',
        packageName: 'foxpilot',
        packageVersion: '0.1.0',
        updateTarget: { npmPackage: 'foxpilot' },
      } as never,
      {
        runNpmUpdate: async (manifest) => `npm:${manifest.updateTarget.npmPackage}`,
        runBrewUpdate: async () => 'brew',
        runReleaseUpdate: async () => 'release',
      },
    )

    expect(result).toBe('npm:foxpilot')
  })

  it('maps brew manifests to the brew update branch', async () => {
    const { dispatchUpdate } = await import('@/install/update-dispatcher.js')

    const result = await dispatchUpdate(
      {
        installMethod: 'brew',
        packageName: 'foxpilot',
        packageVersion: '0.1.0',
        updateTarget: { brewFormula: 'foxpilot' },
      } as never,
      {
        runNpmUpdate: async () => 'npm',
        runBrewUpdate: async (manifest) => `brew:${manifest.updateTarget.brewFormula}`,
        runReleaseUpdate: async () => 'release',
      },
    )

    expect(result).toBe('brew:foxpilot')
  })

  it('maps release manifests to the release update branch', async () => {
    const { dispatchUpdate } = await import('@/install/update-dispatcher.js')

    const result = await dispatchUpdate(
      {
        installMethod: 'release',
        packageName: 'foxpilot',
        packageVersion: '0.1.0',
        updateTarget: { releaseAsset: 'foxpilot-darwin-arm64.tar.gz' },
      } as never,
      {
        runNpmUpdate: async () => 'npm',
        runBrewUpdate: async () => 'brew',
        runReleaseUpdate: async (manifest) => `release:${manifest.updateTarget.releaseAsset}`,
      },
    )

    expect(result).toBe('release:foxpilot-darwin-arm64.tar.gz')
  })
})
