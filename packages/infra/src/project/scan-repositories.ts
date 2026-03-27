/**
 * @file src/project/scan-repositories.ts
 * @author michaeljou
 */

import { access, readdir } from 'node:fs/promises'
import path from 'node:path'

import type { ProjectRepositoryConfig } from '@foxpilot/infra/project/project-config.js'

/**
 * 检查目录中是否包含 Git 仓库标记。
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
 * 为项目根目录构建兜底仓库描述。
 */
function createRootCandidate(
  projectRoot: string,
  repoType: 'git' | 'directory',
): ProjectRepositoryConfig {
  return {
    name: path.basename(projectRoot) || 'root',
    path: '.',
    repoType,
    languageStack: '',
  }
}

/**
 * 扫描项目根目录中的仓库候选项，当前 MVP 只识别根仓库和直接子目录中的 Git 仓库。
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
