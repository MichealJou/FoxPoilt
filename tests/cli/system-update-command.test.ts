import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('update CLI', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const target = tempDirs.pop()
      if (target) {
        await removeTempDir(target)
      }
    }
  })

  it('routes npm installs to the npm update branch', async () => {
    const homeDir = await createTempDir('foxpilot-update-home-')
    const tempDir = await createTempDir('foxpilot-update-bin-')
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

    const result = await runCli(['update'], {
      homeDir,
      executablePath,
      dependencies: {
        dispatchUpdate: async () => 'strategy: npm\ncommand: npm install -g foxpilot@latest\nexitCode: 0',
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('installMethod: npm')
    expect(result.stdout).toContain('strategy: npm')
  })

  it('fails clearly when the current executable has no install manifest', async () => {
    const homeDir = await createTempDir('foxpilot-update-home-')
    const tempDir = await createTempDir('foxpilot-update-bin-')
    tempDirs.push(homeDir, tempDir)

    const executablePath = path.join(tempDir, 'foxpilot')
    await mkdir(tempDir, { recursive: true })
    await writeFile(executablePath, '#!/bin/sh\n')

    const result = await runCli(['update'], {
      homeDir,
      executablePath,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('无法识别当前安装来源')
  })
})
