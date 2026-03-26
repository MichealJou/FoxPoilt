import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { registerCurrentInstallation } from '@/install/install-index.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('install index registration', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const target = tempDirs.pop()
      if (target) {
        await removeTempDir(target)
      }
    }
  })

  it('writes the current install manifest and the user-level install index', async () => {
    const homeDir = await createTempDir('foxpilot-install-home-')
    const installRoot = await createTempDir('foxpilot-install-root-')
    tempDirs.push(homeDir, installRoot)

    const result = await registerCurrentInstallation({
      homeDir,
      installMethod: 'npm',
      packageName: 'foxpilot',
      packageVersion: '0.1.0',
      channel: 'stable',
      platform: 'darwin',
      arch: 'arm64',
      installRoot,
      executablePath: path.join(installRoot, 'dist', 'cli', 'run.js'),
      updateTarget: {
        npmPackage: 'foxpilot',
      },
      now: '2026-03-26T00:00:00.000Z',
    })

    const manifest = JSON.parse(await readFile(result.manifestPath, 'utf-8'))
    const installIndex = JSON.parse(await readFile(result.indexPath, 'utf-8'))

    expect(manifest.installMethod).toBe('npm')
    expect(manifest.packageVersion).toBe('0.1.0')
    expect(installIndex).toHaveLength(1)
    expect(installIndex[0]).toMatchObject({
      installMethod: 'npm',
      packageVersion: '0.1.0',
      installRoot,
    })
  })

  it('upserts the same install root without duplicating the install index', async () => {
    const homeDir = await createTempDir('foxpilot-install-home-')
    const installRoot = await createTempDir('foxpilot-install-root-')
    tempDirs.push(homeDir, installRoot)

    await registerCurrentInstallation({
      homeDir,
      installMethod: 'npm',
      packageName: 'foxpilot',
      packageVersion: '0.1.0',
      channel: 'stable',
      platform: 'darwin',
      arch: 'arm64',
      installRoot,
      executablePath: path.join(installRoot, 'dist', 'cli', 'run.js'),
      updateTarget: {
        npmPackage: 'foxpilot',
      },
      now: '2026-03-26T00:00:00.000Z',
    })

    const second = await registerCurrentInstallation({
      homeDir,
      installMethod: 'npm',
      packageName: 'foxpilot',
      packageVersion: '0.1.1',
      channel: 'stable',
      platform: 'darwin',
      arch: 'arm64',
      installRoot,
      executablePath: path.join(installRoot, 'dist', 'cli', 'run.js'),
      updateTarget: {
        npmPackage: 'foxpilot',
      },
      now: '2026-03-27T00:00:00.000Z',
    })

    const installIndex = JSON.parse(await readFile(second.indexPath, 'utf-8'))

    expect(installIndex).toHaveLength(1)
    expect(installIndex[0]).toMatchObject({
      packageVersion: '0.1.1',
      lastSeenAt: '2026-03-27T00:00:00.000Z',
    })
  })
})
