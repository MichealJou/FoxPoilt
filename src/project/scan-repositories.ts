/**
 * @file src/project/scan-repositories.ts
 * @author michaeljou
 */

import { access, readdir } from 'node:fs/promises'
import path from 'node:path'

import type { ProjectRepositoryConfig } from '@/project/project-config.js'

/**
 * Checks whether a directory contains a Git repository marker.
 */
async function isGitRepository(targetPath: string): Promise<boolean> {
  try {
    await access(path.join(targetPath, '.git'))
    return true
  } catch {
    return false
  }
}

/**
 * Builds the fallback repository descriptor for the project root.
 */
function createRootCandidate(projectRoot: string, repoType: 'git' | 'directory'): ProjectRepositoryConfig {
  return {
    name: path.basename(projectRoot) || 'root',
    path: '.',
    repoType,
    languageStack: '',
  }
}

/**
 * Scans the project root for repository candidates. The current MVP only
 * detects the root repo and direct child Git repositories.
 */
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
