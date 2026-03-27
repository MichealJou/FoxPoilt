import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('platforms resolve CLI', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const target = tempDirs.pop()
      if (target) {
        await removeTempDir(target)
      }
    }
  })

  it('returns structured json resolution output for an initialized project', async () => {
    const projectRoot = await createTempDir('foxpilot-platform-resolve-')
    tempDirs.push(projectRoot)

    await mkdir(path.join(projectRoot, '.foxpilot'), { recursive: true })
    await writeFile(
      path.join(projectRoot, '.foxpilot', 'project.json'),
      JSON.stringify(
        {
          version: 2,
          name: 'demo-project',
          displayName: 'Demo Project',
          rootPath: projectRoot,
          status: 'managed',
          repositories: [],
          orchestration: {
            profile: {
              selected: 'default',
            },
            platformResolution: {
              generatedAt: '2026-03-27T00:00:00.000Z',
              stages: [],
            },
          },
        },
        null,
        2,
      ),
    )

    const result = await runCli(['platforms', 'resolve', '--json'], {
      cwd: projectRoot,
      dependencies: {
        resolvePlatformResolution: async () => ({
          generatedAt: '2026-03-27T00:00:00.000Z',
          stages: [
            {
              stage: 'design',
              role: 'designer',
              platform: {
                recommended: 'codex',
                effective: 'codex',
                source: 'auto-detect',
              },
            },
            {
              stage: 'implement',
              role: 'coder',
              platform: {
                recommended: 'claude_code',
                effective: 'manual',
                source: 'fallback',
              },
            },
          ],
        }),
      },
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        projectId: string
        selectedProfile: string
        stages: Array<{
          stage: string
          role: string
          recommendedPlatform: string
          effectivePlatform: string
          source: string
        }>
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.command).toBe('platforms resolve')
    expect(payload.data.projectId).toBe('demo-project')
    expect(payload.data.selectedProfile).toBe('default')
    expect(payload.data.stages[0]?.recommendedPlatform).toBe('codex')
    expect(payload.data.stages[1]?.effectivePlatform).toBe('manual')
  })

  it('returns structured json error when current directory is not an initialized project', async () => {
    const cwd = await createTempDir('foxpilot-platform-resolve-empty-')
    tempDirs.push(cwd)

    const result = await runCli(['platforms', 'resolve', '--json'], {
      cwd,
    })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      error: {
        code: string
      }
    }

    expect(result.exitCode).toBe(1)
    expect(payload.ok).toBe(false)
    expect(payload.command).toBe('platforms resolve')
    expect(payload.error.code).toBe('PROJECT_NOT_INITIALIZED')
  })
})
