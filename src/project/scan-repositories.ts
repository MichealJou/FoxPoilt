import { access, readdir } from 'node:fs/promises'
import path from 'node:path'

import type { ProjectRepositoryConfig } from './project-config.js'

async function isGitRepository(targetPath: string): Promise<boolean> {
  try {
    await access(path.join(targetPath, '.git'))
    return true
  } catch {
    return false
  }
}

function createRootCandidate(projectRoot: string, repoType: 'git' | 'directory'): ProjectRepositoryConfig {
  return {
    name: path.basename(projectRoot) || 'root',
    path: '.',
    repoType,
    languageStack: '',
  }
}

export async function scanRepositories(
  projectRoot: string,
  options: { noScan?: boolean } = {},
): Promise<ProjectRepositoryConfig[]> {
  const rootIsGit = await isGitRepository(projectRoot)

  if (options.noScan) {
    return [createRootCandidate(projectRoot, rootIsGit ? 'git' : 'directory')]
  }

  const repositories: ProjectRepositoryConfig[] = []

  if (rootIsGit) {
    repositories.push(createRootCandidate(projectRoot, 'git'))
  }

  const entries = await readdir(projectRoot, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.git') {
      continue
    }

    const absolutePath = path.join(projectRoot, entry.name)
    if (!(await isGitRepository(absolutePath))) {
      continue
    }

    repositories.push({
      name: entry.name,
      path: entry.name,
      repoType: 'git',
      languageStack: '',
    })
  }

  if (repositories.length === 0) {
    repositories.push(createRootCandidate(projectRoot, 'directory'))
  }

  return repositories
}
