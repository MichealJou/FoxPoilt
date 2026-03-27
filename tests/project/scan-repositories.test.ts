import { afterEach, describe, expect, it } from 'vitest'
import { mkdir } from 'node:fs/promises'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

type RepositoryCandidate = {
  name: string
  path: string
  repoType: 'git' | 'directory' | 'subrepo'
  languageStack: string
}

type ScanRepositories = (
  projectRoot: string,
  options?: { noScan?: boolean },
) => Promise<RepositoryCandidate[]>

async function loadScanRepositoriesModule(): Promise<{
  scanRepositories: ScanRepositories
}> {
  try {
    return await import('@foxpilot/infra/project/scan-repositories.js')
  } catch {
    return {
      scanRepositories: async () => [],
    }
  }
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

describe('scan repositories', () => {
  it('detects root and first-level git repositories', async () => {
    const projectRoot = await createTempDir('foxpilot-scan-')
    tempDirs.push(projectRoot)
    const { scanRepositories } = await loadScanRepositoriesModule()

    await mkdir(`${projectRoot}/.git`, { recursive: true })
    await mkdir(`${projectRoot}/frontend/.git`, { recursive: true })
    await mkdir(`${projectRoot}/docs`, { recursive: true })

    const repos = await scanRepositories(projectRoot)

    expect(repos.map((item) => item.path)).toContain('.')
    expect(repos.map((item) => item.path)).toContain('frontend')
    expect(repos.map((item) => item.path)).not.toContain('docs')
  })

  it('returns only the root repository when noScan is enabled', async () => {
    const projectRoot = await createTempDir('foxpilot-scan-')
    tempDirs.push(projectRoot)
    const { scanRepositories } = await loadScanRepositoriesModule()

    await mkdir(`${projectRoot}/frontend/.git`, { recursive: true })

    const repos = await scanRepositories(projectRoot, { noScan: true })

    expect(repos).toHaveLength(1)
    expect(repos[0]?.path).toBe('.')
  })
})
