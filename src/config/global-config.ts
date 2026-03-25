import { access } from 'node:fs/promises'
import path from 'node:path'

import { readJsonFile, writeJsonFile } from '../core/json-file.js'
import { resolveGlobalConfigPath } from '../core/paths.js'

export type GlobalConfig = {
  workspaceRoots: string[]
  defaultProjectMode: string
  defaultTaskView: string
  defaultExecutor: string
}

export const defaultGlobalConfig: GlobalConfig = {
  workspaceRoots: [],
  defaultProjectMode: 'workspace_root',
  defaultTaskView: 'table',
  defaultExecutor: 'codex',
}

export class GlobalConfigParseError extends Error {
  constructor(public readonly configPath: string, options?: { cause?: unknown }) {
    super(`Failed to parse global config: ${configPath}`, options)
    this.name = 'GlobalConfigParseError'
  }
}

function normalizePaths(paths: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of paths) {
    const normalized = path.resolve(item)
    if (seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

function isWithin(rootPath: string, targetPath: string): boolean {
  const relative = path.relative(path.resolve(rootPath), path.resolve(targetPath))
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

export function findMatchingWorkspaceRoot(projectRoot: string, workspaceRoots: string[]): string | null {
  const matches = normalizePaths(workspaceRoots)
    .filter((rootPath) => isWithin(rootPath, projectRoot))
    .sort((left, right) => right.length - left.length)

  return matches[0] ?? null
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function readExistingConfig(configPath: string): Promise<GlobalConfig | null> {
  if (!(await fileExists(configPath))) {
    return null
  }

  try {
    return await readJsonFile<GlobalConfig>(configPath)
  } catch (error) {
    throw new GlobalConfigParseError(configPath, { cause: error })
  }
}

export async function readGlobalConfig(input: { homeDir: string }): Promise<{
  configPath: string
  config: GlobalConfig
}> {
  const configPath = resolveGlobalConfigPath(input.homeDir)
  const existingConfig = await readExistingConfig(configPath)

  return {
    configPath,
    config: existingConfig ?? defaultGlobalConfig,
  }
}

function mergeGlobalConfig(existing: GlobalConfig, workspaceRoot?: string): GlobalConfig {
  const roots = workspaceRoot
    ? normalizePaths([...existing.workspaceRoots, workspaceRoot])
    : normalizePaths(existing.workspaceRoots)

  return {
    ...existing,
    workspaceRoots: roots,
  }
}

export async function ensureGlobalConfig(input: {
  homeDir: string
  workspaceRoot?: string
}): Promise<{ configPath: string; config: GlobalConfig }> {
  const { configPath, config: baseConfig } = await readGlobalConfig({ homeDir: input.homeDir })
  const config = mergeGlobalConfig(baseConfig, input.workspaceRoot)

  await writeJsonFile(configPath, config)

  return {
    configPath,
    config,
  }
}
