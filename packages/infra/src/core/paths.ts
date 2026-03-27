/**
 * @file src/core/paths.ts
 * @author michaeljou
 */

import path from 'node:path'

/**
 * 解析用户主目录下 FoxPilot 使用的根目录。
 */
export function resolveFoxpilotHome(homeDir: string): string {
  return path.join(homeDir, '.foxpilot')
}

/**
 * 解析全局配置文件路径。
 */
export function resolveGlobalConfigPath(homeDir: string): string {
  return path.join(resolveFoxpilotHome(homeDir), 'foxpilot.config.json')
}

/**
 * 解析全局 SQLite 索引数据库路径。
 */
export function resolveGlobalDatabasePath(homeDir: string): string {
  return path.join(resolveFoxpilotHome(homeDir), 'foxpilot.db')
}

/**
 * 解析项目级配置文件路径。
 */
export function resolveProjectConfigPath(projectRoot: string): string {
  return path.join(projectRoot, '.foxpilot', 'project.json')
}
