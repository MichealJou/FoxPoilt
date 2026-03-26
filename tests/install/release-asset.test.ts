import { describe, expect, it } from 'vitest'

import { buildReleaseAssetName, buildReleaseDownloadUrl } from '@/install/release-asset.js'

describe('release asset helpers', () => {
  it('builds tar.gz asset names for unix platforms', () => {
    expect(buildReleaseAssetName({ platform: 'darwin', arch: 'arm64' })).toBe('foxpilot-darwin-arm64.tar.gz')
    expect(buildReleaseAssetName({ platform: 'linux', arch: 'x64' })).toBe('foxpilot-linux-x64.tar.gz')
  })

  it('builds zip asset names for windows', () => {
    expect(buildReleaseAssetName({ platform: 'win32', arch: 'x64' })).toBe('foxpilot-win32-x64.zip')
  })

  it('builds latest release urls', () => {
    expect(
      buildReleaseDownloadUrl({
        repository: 'MichealJou/FoxPoilt',
        version: 'latest',
        assetName: 'foxpilot-darwin-arm64.tar.gz',
      }),
    ).toBe(
      'https://github.com/MichealJou/FoxPoilt/releases/latest/download/foxpilot-darwin-arm64.tar.gz',
    )
  })

  it('builds versioned release urls', () => {
    expect(
      buildReleaseDownloadUrl({
        repository: 'MichealJou/FoxPoilt',
        version: '0.1.0',
        assetName: 'foxpilot-linux-x64.tar.gz',
      }),
    ).toBe(
      'https://github.com/MichealJou/FoxPoilt/releases/download/v0.1.0/foxpilot-linux-x64.tar.gz',
    )
  })
})
