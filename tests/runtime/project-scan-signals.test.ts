import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { collectProjectScanSignals } from '@foxpilot/runtime/init/project-scan-signals.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('project scan signals', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const target = tempDirs.pop()
      if (target) {
        await removeTempDir(target)
      }
    }
  })

  it('collects structure, stack and workflow signals from a multi-repo node project', async () => {
    const projectRoot = await createTempDir('foxpilot-signals-')
    tempDirs.push(projectRoot)

    await mkdir(path.join(projectRoot, '.git'), { recursive: true })
    await mkdir(path.join(projectRoot, 'frontend', '.git'), { recursive: true })
    await mkdir(path.join(projectRoot, 'docs'), { recursive: true })
    await mkdir(path.join(projectRoot, 'tests'), { recursive: true })
    await mkdir(path.join(projectRoot, '.github', 'workflows'), { recursive: true })
    await writeFile(path.join(projectRoot, 'package.json'), JSON.stringify({
      dependencies: {
        react: '^19.0.0',
      },
      devDependencies: {
        vite: '^7.0.0',
      },
    }))
    await writeFile(path.join(projectRoot, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n')

    const result = await collectProjectScanSignals({
      projectRoot,
      repositories: [
        {
          name: 'root',
          path: '.',
          repoType: 'git',
          languageStack: '',
        },
        {
          name: 'frontend',
          path: 'frontend',
          repoType: 'git',
          languageStack: '',
        },
      ],
      scannedAt: '2026-03-27T00:00:00.000Z',
    })

    expect(result.structure.repositoryLayout).toBe('multi-repo')
    expect(result.structure.hasMonorepoMarkers).toBe(true)
    expect(result.stack.languages).toContain('typescript')
    expect(result.stack.packageManagers).toContain('pnpm')
    expect(result.stack.frameworkHints).toEqual(expect.arrayContaining(['react', 'vite']))
    expect(result.workflow.hasTests).toBe(true)
    expect(result.workflow.hasCiConfig).toBe(true)
    expect(result.health.missingProjectConfig).toBe(true)
  })
})
