/**
 * @file src/install/install-manifest.ts
 * @author michaeljou
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { InstallIndexEntry, InstallManifest } from '@/install/install-types.js'
import { resolveInstallIndexPath, resolveInstallManifestPath } from '@/install/install-paths.js'

/**
 * 读取与当前可执行实例绑定的安装清单。
 *
 * 如果实例清单不存在，这里返回 `undefined`，而不是抛异常。
 * 这样 `install-info` 和 `update` 可以区分：
 * - 当前命令没有安装元数据；
 * - 当前命令有元数据但内容损坏。
 */
export async function readInstallManifest({
  executablePath,
}: {
  executablePath: string
}): Promise<InstallManifest | undefined> {
  const manifestPaths = [
    resolveInstallManifestPath(executablePath),
    path.join(path.dirname(executablePath), '..', 'install-manifest.json'),
    path.join(path.dirname(executablePath), '..', '..', 'install-manifest.json'),
    path.join(path.dirname(executablePath), '..', '..', '..', 'install-manifest.json'),
  ]

  for (const manifestPath of manifestPaths) {
    try {
      const raw = await readFile(manifestPath, 'utf-8')
      return JSON.parse(raw) as InstallManifest
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        continue
      }

      throw error
    }
  }

  return undefined
}

/**
 * 读取用户级安装索引。
 *
 * 第一版把“索引缺失”视为正常状态，因此在文件不存在时返回空数组，
 * 方便调用方直接做展示和统计。
 */
export async function readInstallIndex({
  homeDir,
}: {
  homeDir: string
}): Promise<InstallIndexEntry[]> {
  const indexPath = resolveInstallIndexPath(homeDir)

  try {
    const raw = await readFile(indexPath, 'utf-8')
    return JSON.parse(raw) as InstallIndexEntry[]
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}
