import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('uninstall CLI', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const target = tempDirs.pop()
      if (target) {
        await removeTempDir(target)
      }
    }
  })

  it('prints usage when called with --help', async () => {
    const result = await runCli(['uninstall', '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot uninstall')
    expect(result.stdout).toContain('fp uninstall')
  })

  it('routes npm installs to the npm uninstall branch and clears the install index entry', async () => {
    const homeDir = await createTempDir('foxpilot-uninstall-home-')
    const tempDir = await createTempDir('foxpilot-uninstall-bin-')
    tempDirs.push(homeDir, tempDir)

    const executablePath = path.join(tempDir, 'foxpilot')
    await mkdir(path.join(homeDir, '.foxpilot'), { recursive: true })
    await writeFile(executablePath, '#!/bin/sh\n')
    await writeFile(
      path.join(tempDir, 'install-manifest.json'),
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
    await writeFile(
      path.join(homeDir, '.foxpilot', 'installations.json'),
      JSON.stringify(
        [
          {
            installId: 'npm:darwin:arm64:/usr/local/lib/node_modules/foxpilot',
            installMethod: 'npm',
            packageVersion: '0.1.0',
            platform: 'darwin',
            arch: 'arm64',
            installRoot: '/usr/local/lib/node_modules/foxpilot',
            binPath: executablePath,
            lastSeenAt: '2026-03-26T00:00:00.000Z',
          },
        ],
        null,
        2,
      ),
    )

    const result = await runCli(['uninstall'], {
      homeDir,
      executablePath,
      dependencies: {
        dispatchUninstall: async () =>
          'strategy: npm\ncommand: npm uninstall -g foxpilot\nexitCode: 0',
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('installMethod: npm')
    expect(result.stdout).toContain('strategy: npm')

    const rawIndex = await readFile(path.join(homeDir, '.foxpilot', 'installations.json'), 'utf8')
    expect(rawIndex).toBe('[]')
  })

  it('purges user data when called with --purge', async () => {
    const homeDir = await createTempDir('foxpilot-uninstall-home-')
    const tempDir = await createTempDir('foxpilot-uninstall-bin-')
    tempDirs.push(homeDir, tempDir)

    const executablePath = path.join(tempDir, 'foxpilot')
    await mkdir(path.join(homeDir, '.foxpilot'), { recursive: true })
    await writeFile(executablePath, '#!/bin/sh\n')
    await writeFile(
      path.join(tempDir, 'install-manifest.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          installMethod: 'release',
          packageName: 'foxpilot',
          packageVersion: '0.1.0',
          channel: 'stable',
          platform: 'darwin',
          arch: 'arm64',
          installRoot: path.join(homeDir, '.foxpilot', 'release', 'current'),
          binPath: executablePath,
          updateTarget: {
            releaseAsset: 'foxpilot-darwin-arm64.tar.gz',
          },
          installedAt: '2026-03-26T00:00:00.000Z',
          updatedAt: '2026-03-26T00:00:00.000Z',
        },
        null,
        2,
      ),
    )
    await writeFile(path.join(homeDir, '.foxpilot', 'foxpilot.config.json'), '{}')

    const result = await runCli(['uninstall', '--purge'], {
      homeDir,
      executablePath,
      dependencies: {
        dispatchUninstall: async () => 'strategy: release\nexitCode: 0',
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('purge: true')
    await expect(
      readFile(path.join(homeDir, '.foxpilot', 'foxpilot.config.json'), 'utf8'),
    ).rejects.toBeDefined()
  })

  it('fails clearly when the current executable has no install manifest', async () => {
    const homeDir = await createTempDir('foxpilot-uninstall-home-')
    const tempDir = await createTempDir('foxpilot-uninstall-bin-')
    tempDirs.push(homeDir, tempDir)

    const executablePath = path.join(tempDir, 'foxpilot')
    await mkdir(tempDir, { recursive: true })
    await writeFile(executablePath, '#!/bin/sh\n')

    const result = await runCli(['uninstall'], {
      homeDir,
      executablePath,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('无法识别当前安装来源')
  })

  it('returns structured json uninstall metadata when called with --json', async () => {
    const homeDir = await createTempDir('foxpilot-uninstall-home-')
    const tempDir = await createTempDir('foxpilot-uninstall-bin-')
    tempDirs.push(homeDir, tempDir)

    const executablePath = path.join(tempDir, 'foxpilot')
    await mkdir(path.join(homeDir, '.foxpilot'), { recursive: true })
    await writeFile(executablePath, '#!/bin/sh\n')
    await writeFile(
      path.join(tempDir, 'install-manifest.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          installMethod: 'release',
          packageName: 'foxpilot',
          packageVersion: '0.1.4',
          channel: 'stable',
          platform: 'darwin',
          arch: 'arm64',
          installRoot: path.join(homeDir, '.foxpilot', 'release', 'current'),
          binPath: executablePath,
          updateTarget: {
            releaseAsset: 'foxpilot-darwin-arm64.tar.gz',
          },
          installedAt: '2026-03-26T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z',
        },
        null,
        2,
      ),
    )
    await writeFile(
      path.join(homeDir, '.foxpilot', 'installations.json'),
      JSON.stringify(
        [
          {
            installId: `release:darwin:arm64:${path.join(homeDir, '.foxpilot', 'release', 'current')}`,
            installMethod: 'release',
            packageVersion: '0.1.4',
            platform: 'darwin',
            arch: 'arm64',
            installRoot: path.join(homeDir, '.foxpilot', 'release', 'current'),
            binPath: executablePath,
            lastSeenAt: '2026-03-27T00:00:00.000Z',
          },
        ],
        null,
        2,
      ),
    )

    const result = await runCli(['uninstall', '--json'], {
      homeDir,
      executablePath,
      dependencies: {
        dispatchUninstall: async () => 'strategy: release\nexitCode: 0',
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        installMethod: string
        packageVersion: string
        purge: boolean
        remainingInstalls: number
        strategy: string
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('uninstall')
    expect(payload.data.installMethod).toBe('release')
    expect(payload.data.packageVersion).toBe('0.1.4')
    expect(payload.data.purge).toBe(false)
    expect(payload.data.remainingInstalls).toBe(0)
    expect(payload.data.strategy).toContain('strategy: release')
  })
})
