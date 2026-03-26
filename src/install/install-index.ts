/**
 * @file src/install/install-index.ts
 * @author michaeljou
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { readInstallIndex } from '@/install/install-manifest.js'
import { resolveInstallIndexPath } from '@/install/install-paths.js'
import type { InstallIndexEntry, InstallManifest } from '@/install/install-types.js'

/**
 * 根据实例关键信息生成稳定的安装记录 ID。
 *
 * 第一版采用“来源 + 平台 + 架构 + 安装根目录”的组合，
 * 用来保证同一安装根目录重复登记时会走更新而不是重复新增。
 */
export function createInstallId(manifest: Pick<InstallManifest, 'installMethod' | 'platform' | 'arch' | 'installRoot'>): string {
  return [manifest.installMethod, manifest.platform, manifest.arch, manifest.installRoot].join(':')
}

/**
 * 注册当前安装实例，并同步写入实例清单和用户级安装索引。
 */
export async function registerCurrentInstallation(input: {
  homeDir: string
  installMethod: InstallManifest['installMethod']
  packageName: string
  packageVersion: string
  channel: string
  platform: InstallManifest['platform']
  arch: InstallManifest['arch']
  installRoot: string
  executablePath: string
  updateTarget: InstallManifest['updateTarget']
  now?: string
}): Promise<{
  manifest: InstallManifest
  manifestPath: string
  indexPath: string
}> {
  const now = input.now ?? new Date().toISOString()
  const manifest: InstallManifest = {
    schemaVersion: 1,
    installMethod: input.installMethod,
    packageName: input.packageName,
    packageVersion: input.packageVersion,
    channel: input.channel,
    platform: input.platform,
    arch: input.arch,
    installRoot: input.installRoot,
    binPath: input.executablePath,
    updateTarget: input.updateTarget,
    installedAt: now,
    updatedAt: now,
  }
  const manifestPath = path.join(input.installRoot, 'install-manifest.json')
  const indexPath = resolveInstallIndexPath(input.homeDir, input.platform)

  await mkdir(input.installRoot, { recursive: true })
  await mkdir(path.dirname(indexPath), { recursive: true })
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))

  const existing = await readInstallIndex({ homeDir: input.homeDir })
  const installId = createInstallId(manifest)
  const nextEntry: InstallIndexEntry = {
    installId,
    installMethod: manifest.installMethod,
    packageVersion: manifest.packageVersion,
    platform: manifest.platform,
    arch: manifest.arch,
    installRoot: manifest.installRoot,
    binPath: manifest.binPath,
    lastSeenAt: now,
  }
  const withoutCurrent = existing.filter((entry) => entry.installId !== installId)
  const nextIndex = [...withoutCurrent, nextEntry]

  await writeFile(indexPath, JSON.stringify(nextIndex, null, 2))

  return {
    manifest,
    manifestPath,
    indexPath,
  }
}

/**
 * 从用户级安装索引中移除当前安装实例。
 *
 * 卸载命令完成真实卸载动作后，需要主动清掉索引记录，
 * 否则 `install-info` 还会继续显示一条已经失效的旧安装。
 */
export async function unregisterCurrentInstallation(input: {
  homeDir: string
  manifest: Pick<InstallManifest, 'installMethod' | 'platform' | 'arch' | 'installRoot'>
}): Promise<{
  indexPath: string
  remainingCount: number
}> {
  const indexPath = resolveInstallIndexPath(input.homeDir, input.manifest.platform)
  const existing = await readInstallIndex({ homeDir: input.homeDir })
  const installId = createInstallId(input.manifest)
  const nextIndex = existing.filter((entry) => entry.installId !== installId)

  await mkdir(path.dirname(indexPath), { recursive: true })
  await writeFile(indexPath, JSON.stringify(nextIndex, null, 2))

  return {
    indexPath,
    remainingCount: nextIndex.length,
  }
}
