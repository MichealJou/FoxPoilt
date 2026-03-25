/**
 * @file src/project/resolve-project.ts
 * @author michaeljou
 */

import { access } from 'node:fs/promises'
import path from 'node:path'

import { readJsonFile } from '@/core/json-file.js'
import { resolveProjectConfigPath } from '@/core/paths.js'

import type { ProjectConfig, ProjectRepositoryConfig } from '@/project/project-config.js'

/**
 * Raised when a CLI command is executed outside a managed project.
 */
export class ProjectNotInitializedError extends Error {
  constructor(
    public readonly projectRoot: string,
    public readonly configPath: string,
  ) {
    super(`Project is not initialized: ${projectRoot}`)
    this.name = 'ProjectNotInitializedError'
  }
}

/**
 * Raised when a task command references a repository that does not exist in
 * the project config.
 */
export class RepositoryTargetNotFoundError extends Error {
  constructor(public readonly repositorySelector: string) {
    super(`Repository target not found: ${repositorySelector}`)
    this.name = 'RepositoryTargetNotFoundError'
  }
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function findManagedProjectRoot(startPath: string): Promise<string | null> {
  let currentPath = path.resolve(startPath)

  // Walk upward until a managed project marker is found or the filesystem root
  // is reached.
  while (true) {
    if (await fileExists(resolveProjectConfigPath(currentPath))) {
      return currentPath
    }

    const parentPath = path.dirname(currentPath)
    if (parentPath === currentPath) {
      return null
    }

    currentPath = parentPath
  }
}

/**
 * Resolves the active managed project either from `--path` or by walking up
 * from the current working directory.
 */
export async function resolveManagedProject(input: {
  cwd: string
  projectPath?: string
}): Promise<{
  projectRoot: string
  configPath: string
  projectConfig: ProjectConfig
}> {
  const projectRoot = input.projectPath
    ? path.resolve(input.cwd, input.projectPath)
    : await findManagedProjectRoot(input.cwd)

  if (!projectRoot) {
    throw new ProjectNotInitializedError(input.cwd, resolveProjectConfigPath(input.cwd))
  }

  const configPath = resolveProjectConfigPath(projectRoot)
  if (!(await fileExists(configPath))) {
    throw new ProjectNotInitializedError(projectRoot, configPath)
  }

  return {
    projectRoot,
    configPath,
    projectConfig: await readJsonFile<ProjectConfig>(configPath),
  }
}

/**
 * Resolves an optional repository selector against the initialized project.
 */
export function resolveRepositoryTarget(
  projectConfig: ProjectConfig,
  repositorySelector?: string,
): ProjectRepositoryConfig | null {
  if (!repositorySelector) {
    return null
  }

  const repository = projectConfig.repositories.find(
    (item) => item.name === repositorySelector || item.path === repositorySelector,
  )

  if (!repository) {
    throw new RepositoryTargetNotFoundError(repositorySelector)
  }

  return repository
}
