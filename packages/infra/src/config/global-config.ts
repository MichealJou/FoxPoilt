/**
 * @file src/config/global-config.ts
 * @author michaeljou
 */

import { access } from 'node:fs/promises'
import path from 'node:path'

import {
  isInterfaceLanguage,
  type InterfaceLanguage,
} from '@foxpilot/contracts/interface-language.js'
import { readJsonFile, writeJsonFile } from '@foxpilot/infra/core/json-file.js'
import { resolveGlobalConfigPath } from '@foxpilot/infra/core/paths.js'

/**
 * 所有本地项目共享的用户级配置。
 *
 * 设计意图：
 * 1. 这份配置只保存“跨项目复用”的默认偏好，不保存某个具体项目的业务状态。
 * 2. 配置文件允许用户手工编辑，因此读取时必须做默认值补齐和字段校正。
 * 3. 语言字段放在这里，是为了让所有命令在进入业务逻辑前就能拿到统一的交互语言。
 */
export type GlobalConfig = {
  /**
   * 当前用户确认过的工作区根目录列表。
   *
   * 这里保存的是“工作区边界”，不是项目列表。
   * 后续命令会用它来推断项目默认归属，并选择最长匹配的工作区根目录。
   */
  workspaceRoots: string[]
  /**
   * 后续命令默认使用的项目登记模式。
   *
   * 当前 MVP 只实际使用 `workspace_root`，但这里先保留扩展位，
   * 避免后续引入新模式时必须立刻修改配置结构。
   */
  defaultProjectMode: string
  /**
   * 默认任务列表展示模式。
   *
   * 这个字段当前主要作为配置占位，为后续表格视图、看板视图等展示形态做兼容。
   */
  defaultTaskView: string
  /**
   * 手动创建新任务时的默认执行器。
   *
   * 任务创建时会把这个值折叠成 `current_executor`，因此它表达的是“新任务默认归谁处理”。
   */
  defaultExecutor: string
  /**
   * 面向用户的 CLI 默认交互语言。
   *
   * 首次交互式初始化可以写入这个字段，后续所有命令都会先读取它再决定输出语言。
   */
  interfaceLanguage: InterfaceLanguage
}

/**
 * 当全局配置文件尚不存在时使用的基线配置。
 *
 * 设计逻辑：
 * 1. 默认语言固定为中文，符合当前产品的默认交互方向。
 * 2. 其余默认值以“最保守可运行”为目标，优先保证命令能工作，而不是表达复杂偏好。
 */
export const defaultGlobalConfig: GlobalConfig = {
  workspaceRoots: [],
  defaultProjectMode: 'workspace_root',
  defaultTaskView: 'table',
  defaultExecutor: 'codex',
  interfaceLanguage: 'zh-CN',
}

export class GlobalConfigParseError extends Error {
  constructor(
    public readonly configPath: string,
    options?: { cause?: unknown },
  ) {
    super(`Failed to parse global config: ${configPath}`, options)
    this.name = 'GlobalConfigParseError'
  }
}

/**
 * 将工作区根目录标准化为唯一的绝对路径。
 *
 * 设计逻辑：
 * 1. 一律转绝对路径，避免同一个目录因相对路径写法不同而重复出现。
 * 2. 去重后保留首次出现顺序，减少用户手工编辑后带来的不确定性。
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
 * 返回最长匹配的工作区根目录。
 *
 * 设计逻辑：
 * 1. 允许工作区嵌套存在，例如 `/Users/program` 和 `/Users/program/code`。
 * 2. 当项目路径同时命中多个工作区时，必须选更具体的那个，否则项目会被错误归到更大的上层空间。
 */
export function findMatchingWorkspaceRoot(
  projectRoot: string,
  workspaceRoots: string[],
): string | null {
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
      ? normalizePaths(
          config.workspaceRoots.filter((item): item is string => typeof item === 'string'),
        )
      : [],
    interfaceLanguage,
  }
}

/**
 * 从磁盘加载全局配置，并返回补齐默认值后的完整对象。
 *
 * 设计逻辑：
 * 1. 读取层负责“容错和补齐”，业务层只消费稳定结构。
 * 2. 即使旧版本配置缺字段，也能在这里被兼容，而不是把兼容逻辑散落到每个命令里。
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

/**
 * 确保全局配置文件存在，并按需合并工作区根目录或交互语言。
 *
 * 设计逻辑：
 * 1. 这是“增量写入”接口，不会无条件覆盖整个配置。
 * 2. 只有调用方显式传入的字段才会更新，未传入的字段保持原值。
 * 3. `workspaceRoot` 和 `interfaceLanguage` 被设计成同一次写入可同时更新，
 *    这样 `init` 可以在一次磁盘写入里完成环境登记和语言持久化。
 */
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
 * 解析当前交互语言。
 *
 * 设计逻辑：
 * 1. 语言解析属于“入口前置步骤”，不能因为配置损坏就让所有命令都在入口直接崩掉。
 * 2. 因此这里采用兜底策略，读取失败时回退到默认中文，把真正的配置错误交给具体命令处理。
 */
export async function resolveInterfaceLanguage(input: {
  homeDir: string
}): Promise<InterfaceLanguage> {
  try {
    const { config } = await readGlobalConfig(input)
    return config.interfaceLanguage
  } catch {
    return defaultGlobalConfig.interfaceLanguage
  }
}
