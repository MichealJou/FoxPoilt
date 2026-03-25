/**
 * @file src/config/global-config.ts
 * @author michaeljou
 */

import { access } from 'node:fs/promises'
import path from 'node:path'

import { readJsonFile, writeJsonFile } from '@/core/json-file.js'
import { resolveGlobalConfigPath } from '@/core/paths.js'
import { isInterfaceLanguage, type InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * Serializable user-level configuration shared across all local projects.
 */
export type GlobalConfig = {
  /** Workspace roots known to the current user profile. */
  workspaceRoots: string[]
  /** Default project registration mode for future commands. */
  defaultProjectMode: string
  /** Preferred task list presentation mode. */
  defaultTaskView: string
  /** Preferred executor when new tasks are created manually. */
  defaultExecutor: string
  /** Persisted interface language used for user-facing CLI output. */
  interfaceLanguage: InterfaceLanguage
}

/**
 * Baseline config written when no global file exists yet.
 */
export const defaultGlobalConfig: GlobalConfig = {
  workspaceRoots: [],
  defaultProjectMode: 'workspace_root',
  defaultTaskView: 'table',
  defaultExecutor: 'codex',
  interfaceLanguage: 'zh-CN',
}

export class GlobalConfigParseError extends Error {
  constructor(public readonly configPath: string, options?: { cause?: unknown }) {
    super(`Failed to parse global config: ${configPath}`, options)
    this.name = 'GlobalConfigParseError'
  }
}

/**
 * Normalizes workspace roots to absolute unique paths so matching is stable.
 */
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

/**
 * Returns the longest matching workspace root so nested workspaces win.
 */
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

function normalizeGlobalConfig(config: Partial<GlobalConfig>): GlobalConfig {
  let interfaceLanguage: InterfaceLanguage = defaultGlobalConfig.interfaceLanguage
  if (config.interfaceLanguage && isInterfaceLanguage(config.interfaceLanguage)) {
    interfaceLanguage = config.interfaceLanguage
  }

  return {
    ...defaultGlobalConfig,
    ...config,
    workspaceRoots: Array.isArray(config.workspaceRoots)
      ? normalizePaths(config.workspaceRoots.filter((item): item is string => typeof item === 'string'))
      : [],
    interfaceLanguage,
  }
}

/**
 * Loads global config from disk and always returns a fully hydrated object.
 */
export async function readGlobalConfig(input: { homeDir: string }): Promise<{
  configPath: string
  config: GlobalConfig
}> {
  const configPath = resolveGlobalConfigPath(input.homeDir)
  const existingConfig = await readExistingConfig(configPath)

  return {
    configPath,
    config: existingConfig ? normalizeGlobalConfig(existingConfig) : defaultGlobalConfig,
  }
}

function mergeGlobalConfig(
  existing: GlobalConfig,
  workspaceRoot?: string,
  interfaceLanguage?: InterfaceLanguage,
): GlobalConfig {
  const roots = workspaceRoot
    ? normalizePaths([...existing.workspaceRoots, workspaceRoot])
    : normalizePaths(existing.workspaceRoots)

  return {
    ...existing,
    workspaceRoots: roots,
    interfaceLanguage: interfaceLanguage ?? existing.interfaceLanguage,
  }
}

export async function ensureGlobalConfig(input: {
  homeDir: string
  workspaceRoot?: string
  interfaceLanguage?: InterfaceLanguage
}): Promise<{ configPath: string; config: GlobalConfig }> {
  const { configPath, config: baseConfig } = await readGlobalConfig({ homeDir: input.homeDir })
  const config = mergeGlobalConfig(baseConfig, input.workspaceRoot, input.interfaceLanguage)

  await writeJsonFile(configPath, config)

  return {
    configPath,
    config,
  }
}

/**
 * Resolves the current interface language without turning malformed config
 * into a hard blocker for every command.
 */
export async function resolveInterfaceLanguage(input: { homeDir: string }): Promise<InterfaceLanguage> {
  try {
    const { config } = await readGlobalConfig(input)
    return config.interfaceLanguage
  } catch {
    return defaultGlobalConfig.interfaceLanguage
  }
}
