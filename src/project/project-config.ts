import { access } from 'node:fs/promises'

import { writeJsonFile } from '../core/json-file.js'
import { resolveProjectConfigPath } from '../core/paths.js'

export type ProjectRepositoryConfig = {
  name: string
  path: string
  repoType: 'git' | 'directory' | 'subrepo'
  languageStack: string
}

export type ProjectConfig = {
  name: string
  displayName: string
  rootPath: string
  status: 'managed'
  repositories: ProjectRepositoryConfig[]
}

export class ProjectAlreadyInitializedError extends Error {
  constructor(public readonly configPath: string) {
    super(`Project already initialized: ${configPath}`)
    this.name = 'ProjectAlreadyInitializedError'
  }
}

export function deriveProjectDisplayName(name: string): string {
  return name
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

export async function writeProjectConfig(input: {
  projectRoot: string
  name: string
  repositories: ProjectRepositoryConfig[]
}): Promise<{ configPath: string; config: ProjectConfig }> {
  const configPath = resolveProjectConfigPath(input.projectRoot)

  if (await fileExists(configPath)) {
    throw new ProjectAlreadyInitializedError(configPath)
  }

  const config: ProjectConfig = {
    name: input.name,
    displayName: deriveProjectDisplayName(input.name),
    rootPath: input.projectRoot,
    status: 'managed',
    repositories: input.repositories,
  }

  await writeJsonFile(configPath, config)

  return {
    configPath,
    config,
  }
}
