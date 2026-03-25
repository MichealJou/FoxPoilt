/**
 * @file src/project/project-config.ts
 * @author michaeljou
 */

import { access } from 'node:fs/promises'

import { writeJsonFile } from '@/core/json-file.js'
import { resolveProjectConfigPath } from '@/core/paths.js'

/**
 * Repository metadata persisted inside `.foxpilot/project.json`.
 */
export type ProjectRepositoryConfig = {
  /** Stable repository name shown in CLI output. */
  name: string
  /** Path relative to the project root. */
  path: string
  /** Repository classification discovered during init. */
  repoType: 'git' | 'directory' | 'subrepo'
  /** Human-readable language stack summary. */
  languageStack: string
}

/**
 * Managed project configuration written into each initialized project.
 */
export type ProjectConfig = {
  /** Stable project slug used by catalog rows. */
  name: string
  /** Human-readable display name derived from the slug. */
  displayName: string
  /** Absolute project root path. */
  rootPath: string
  /** Current project management status. */
  status: 'managed'
  /** Repository entries contained by the managed project. */
  repositories: ProjectRepositoryConfig[]
}

/**
 * Raised when the command tries to write over an existing project config.
 */
export class ProjectAlreadyInitializedError extends Error {
  constructor(public readonly configPath: string) {
    super(`Project already initialized: ${configPath}`)
    this.name = 'ProjectAlreadyInitializedError'
  }
}

/**
 * Converts a slug-like project name into a human-friendly display string.
 */
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

  // Persist the exact init result so later commands can resolve repositories
  // without re-running discovery heuristics.
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
