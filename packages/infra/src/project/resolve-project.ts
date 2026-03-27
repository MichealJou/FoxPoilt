/**
 * @file src/project/resolve-project.ts
 * @author michaeljou
 */

import { access } from 'node:fs/promises'
import path from 'node:path'

import { readJsonFile } from '@infra/core/json-file.js'
import { resolveProjectConfigPath } from '@infra/core/paths.js'

import type { ProjectConfig, ProjectRepositoryConfig } from '@infra/project/project-config.js'

/**
 * 当 CLI 命令在未初始化的受管项目之外执行时抛出。
 *
 * 这个错误的核心职责不是表达系统异常，而是向命令层传达“当前没有合法项目上下文”。
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
 * 当任务命令引用了项目配置中不存在的仓库时抛出。
 *
 * 它用于区分“项目不存在”和“项目存在但仓库选择器无效”这两类问题。
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

  /**
   * 设计逻辑：
   * 1. 命令允许在项目子目录中执行，因此需要向上回溯查找 `.foxpilot/project.json`。
   * 2. 一旦走到文件系统根仍未命中，就说明当前目录不属于任何受管项目。
   */
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
 * 通过 `--path` 或从当前目录向上查找的方式解析当前受管项目。
 *
 * 设计逻辑：
 * 1. 显式 `--path` 的优先级高于当前目录推断。
 * 2. 命令层不需要关心项目查找细节，只需要拿到稳定的项目上下文。
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
 * 根据已初始化的项目配置解析可选的仓库选择器。
 *
 * 设计逻辑：
 * 1. 同时支持按仓库名和按相对路径匹配，减少用户记忆成本。
 * 2. 当未传选择器时返回 `null`，表示任务不绑定特定仓库目标。
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
