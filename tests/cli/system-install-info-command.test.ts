import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('install-info CLI', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const target = tempDirs.pop()
      if (target) {
        await removeTempDir(target)
      }
    }
  })

  it('shows unknown install metadata when no instance manifest exists', async () => {
    const homeDir = await createTempDir('foxpilot-install-info-home-')
    const tempDir = await createTempDir('foxpilot-install-info-bin-')
    tempDirs.push(homeDir, tempDir)

    const executablePath = path.join(tempDir, 'foxpilot')
    await writeFile(executablePath, '#!/bin/sh\n')

    const result = await runCli(['install-info'], {
      homeDir,
      executablePath,
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('installMethod: unknown')
    expect(result.stdout).toContain('registeredInstalls: 0')
  })

  it('shows the current instance manifest and registered install count', async () => {
    const homeDir = await createTempDir('foxpilot-install-info-home-')
    const tempDir = await createTempDir('foxpilot-install-info-bin-')
    tempDirs.push(homeDir, tempDir)

    const executablePath = path.join(tempDir, 'foxpilot')
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

    await mkdir(path.join(homeDir, '.foxpilot'), { recursive: true })
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

    const result = await runCli(['install-info'], {
      homeDir,
      executablePath,
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('installMethod: npm')
    expect(result.stdout).toContain('packageVersion: 0.1.0')
    expect(result.stdout).toContain(`binPath: ${executablePath}`)
    expect(result.stdout).toContain('registeredInstalls: 1')
  })

  it('returns structured json install metadata when called with --json', async () => {
    const homeDir = await createTempDir('foxpilot-install-info-home-')
    const tempDir = await createTempDir('foxpilot-install-info-bin-')
    tempDirs.push(homeDir, tempDir)

    const executablePath = path.join(tempDir, 'foxpilot')
    await writeFile(executablePath, '#!/bin/sh\n')
    await writeFile(
      path.join(tempDir, 'install-manifest.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          installMethod: 'npm',
          packageName: 'foxpilot',
          packageVersion: '0.1.4',
          channel: 'stable',
          platform: 'darwin',
          arch: 'arm64',
          installRoot: '/usr/local/lib/node_modules/foxpilot',
          binPath: executablePath,
          updateTarget: {
            npmPackage: 'foxpilot',
          },
          installedAt: '2026-03-26T00:00:00.000Z',
          updatedAt: '2026-03-27T00:00:00.000Z',
        },
        null,
        2,
      ),
    )

    const result = await runCli(['install-info', '--json'], {
      homeDir,
      executablePath,
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        version: string
        installMethod: string
        installPath: string
        registeredInstalls: number
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('install-info')
    expect(payload.data.version).toBe('0.1.4')
    expect(payload.data.installMethod).toBe('npm')
    expect(payload.data.installPath).toBe(executablePath)
  })
})
