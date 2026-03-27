/**
 * @file src/project/project-config.ts
 * @author michaeljou
 */

import { access } from 'node:fs/promises'

import { writeJsonFile } from '@foxpilot/infra/core/json-file.js'
import { resolveProjectConfigPath } from '@foxpilot/infra/core/paths.js'
import type { ProjectOrchestrationConfig } from '@foxpilot/contracts/orchestration-contract.js'

/**
 * 持久化在 `.foxpilot/project.json` 中的单仓库元数据。
 *
 * 设计意图：
 * 1. 这里描述的是“项目内部有哪些仓库”，不是全局索引里的仓库事实表。
 * 2. 字段尽量贴近初始化扫描结果，方便后续命令直接消费，不必再做二次推断。
 */
export type ProjectRepositoryConfig = {
  /**
   * 仓库的稳定名称。
   *
   * 这个名字会用于 CLI 展示、命令输入匹配以及任务目标选择，因此要求稳定且可读。
   */
  name: string
  /**
   * 相对于项目根目录的路径。
   *
   * 使用相对路径而不是绝对路径，是为了保证项目目录整体迁移后配置仍可复用。
   */
  path: string
  /**
   * 初始化过程中识别出的仓库分类。
   *
   * 当前主要区分根仓库、普通目录和子仓库，为后续扫描建议和任务路由保留基础语义。
   */
  repoType: 'git' | 'directory' | 'subrepo'
  /**
   * 可读的语言栈摘要。
   *
   * 当前 MVP 允许为空字符串，后续可以逐步补充为更精确的技术栈识别结果。
   */
  languageStack: string
}

/**
 * 写入每个已初始化项目中的受管项目配置。
 *
 * 设计意图：
 * 1. 这是项目级“事实配置”，只描述当前项目自己的元信息。
 * 2. 与全局配置分层，避免多个项目互相污染。
 * 3. 与 SQLite 全局索引分层，避免命令在离线或索引损坏时完全失去项目自描述能力。
 */
export type ProjectConfig = {
  /**
   * 第二阶段项目配置版本。
   *
   * 显式写版本可以让后续迁移具备稳定起点。
   */
  version: 2
  /**
   * 项目的稳定标识。
   *
   * 这个值主要用于项目级配置和全局索引之间保持一致的命名语义。
   */
  name: string
  /**
   * 由项目标识派生出的可读显示名。
   *
   * 它主要用于展示层，不作为主键或逻辑匹配条件。
   */
  displayName: string
  /**
   * 项目根目录的绝对路径。
   *
   * 这是命令解析项目范围、向上查找以及写索引时最关键的定位字段。
   */
  rootPath: string
  /**
   * 当前项目的受管状态。
   *
   * 第一阶段先固定为 `managed`，表示项目已经被 FoxPilot 接管。
   */
  status: 'managed'
  /**
   * 当前项目下包含的仓库条目。
   *
   * 这里保存的是项目内的局部仓库视图，供任务创建和仓库选择直接使用。
   */
  repositories: ProjectRepositoryConfig[]
  /**
   * 第二阶段最小编排配置块。
   *
   * 第一批只落 profile 和平台解析快照，后续再继续扩 workflow / bindings。
   */
  orchestration: ProjectOrchestrationConfig
}

/**
 * 当命令试图覆盖已存在的项目配置时抛出。
 *
 * 设计逻辑：
 * 1. 项目初始化是显式动作，不允许静默覆盖。
 * 2. 一旦项目已经存在配置，应要求用户显式处理，而不是默认覆盖原记录。
 */
export class ProjectAlreadyInitializedError extends Error {
  constructor(public readonly configPath: string) {
    super(`Project already initialized: ${configPath}`)
    this.name = 'ProjectAlreadyInitializedError'
  }
}

/**
 * 将类似 slug 的项目名转换为更适合展示的字符串。
 *
 * 设计逻辑：
 * 1. `name` 偏向机器友好，`displayName` 偏向人读。
 * 2. 这里采用轻量规则而不是复杂命名库，避免引入额外依赖。
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
  orchestration: ProjectOrchestrationConfig
}): Promise<{ configPath: string; config: ProjectConfig }> {
  const configPath = resolveProjectConfigPath(input.projectRoot)

  if (await fileExists(configPath)) {
    throw new ProjectAlreadyInitializedError(configPath)
  }

  /**
   * 设计逻辑：
   * 1. 这里精确持久化 init 的扫描结果，后续命令直接读取，不重新扫描目录。
   * 2. 这样可以保证“命令看到的仓库集合”和“初始化时确认过的仓库集合”保持一致。
   */
  const config: ProjectConfig = {
    version: 2,
    name: input.name,
    displayName: deriveProjectDisplayName(input.name),
    rootPath: input.projectRoot,
    status: 'managed',
    repositories: input.repositories,
    orchestration: input.orchestration,
  }

  await writeJsonFile(configPath, config)

  return {
    configPath,
    config,
  }
}
