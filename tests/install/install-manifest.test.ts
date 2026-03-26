import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('install manifest helpers', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const target = tempDirs.pop()
      if (target) {
        await removeTempDir(target)
      }
    }
  })

  it('resolves the default install index path for unix-style platforms', async () => {
    const { resolveInstallIndexPath } = await import('@/install/install-paths.js')

    expect(resolveInstallIndexPath('/tmp/demo-home')).toBe('/tmp/demo-home/.foxpilot/installations.json')
  })

  it('resolves the default install index path for windows', async () => {
    const { resolveInstallIndexPath } = await import('@/install/install-paths.js')

    expect(resolveInstallIndexPath('C:\\Users\\demo', 'win32')).toBe(
      'C:\\Users\\demo\\.foxpilot\\installations.json',
    )
  })

  it('resolves the sibling manifest path from the current executable path', async () => {
    const { resolveInstallManifestPath } = await import('@/install/install-paths.js')

    expect(resolveInstallManifestPath('/usr/local/bin/foxpilot')).toBe('/usr/local/bin/install-manifest.json')
  })

  it('returns undefined when the current executable has no manifest file', async () => {
    const { readInstallManifest } = await import('@/install/install-manifest.js')

    const tempDir = await createTempDir('foxpilot-install-missing-')
    tempDirs.push(tempDir)

    await mkdir(path.join(tempDir, 'bin'), { recursive: true })
    const executablePath = path.join(tempDir, 'bin', 'foxpilot')
    await writeFile(executablePath, '#!/bin/sh\n')

    await expect(readInstallManifest({ executablePath })).resolves.toBeUndefined()
  })

  it('reads a valid install manifest from the current executable directory', async () => {
    const { readInstallManifest } = await import('@/install/install-manifest.js')

    const tempDir = await createTempDir('foxpilot-install-read-')
    tempDirs.push(tempDir)

    const binDir = path.join(tempDir, 'bin')
    const executablePath = path.join(binDir, 'foxpilot')
    await mkdir(binDir, { recursive: true })
    await writeFile(executablePath, '#!/bin/sh\n')
    await writeFile(
      path.join(binDir, 'install-manifest.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          installMethod: 'npm',
          packageName: 'foxpilot',
          packageVersion: '0.1.0',
          channel: 'stable',
          platform: 'darwin',
          arch: 'arm64',
          installRoot: '/usr/local/lib/node_modules/foxpilot',
          binPath: executablePath,
          updateTarget: {
            npmPackage: 'foxpilot',
          },
          installedAt: '2026-03-26T00:00:00.000Z',
          updatedAt: '2026-03-26T00:00:00.000Z',
        },
        null,
        2,
      ),
    )

    await expect(readInstallManifest({ executablePath })).resolves.toMatchObject({
      installMethod: 'npm',
      packageName: 'foxpilot',
      packageVersion: '0.1.0',
      binPath: executablePath,
      updateTarget: {
        npmPackage: 'foxpilot',
      },
    })
  })
})
