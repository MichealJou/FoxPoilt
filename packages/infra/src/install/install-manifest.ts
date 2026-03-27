/**
 * @file src/install/install-manifest.ts
 * @author michaeljou
 */

import { readFile, realpath } from 'node:fs/promises'
import path from 'node:path'

import type { InstallIndexEntry, InstallManifest } from '@foxpilot/infra/install/install-types.js'
import { resolveInstallIndexPath, resolveInstallManifestPath } from '@foxpilot/infra/install/install-paths.js'

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
  const executableCandidates = [executablePath]

  try {
    const resolvedExecutablePath = await realpath(executablePath)
    if (resolvedExecutablePath !== executablePath) {
      executableCandidates.push(resolvedExecutablePath)
    }
  } catch {
    // `.bin/foxpilot` 在某些测试环境里可能不是可解析的真实链接。
    // 这里保持静默回退到原始路径，不把“无法 realpath”视为错误。
  }

  const shimResolvedPath = await resolveExecutableFromShim(executablePath)
  if (shimResolvedPath && !executableCandidates.includes(shimResolvedPath)) {
    executableCandidates.push(shimResolvedPath)
  }

  const manifestPaths = executableCandidates.flatMap((candidatePath) => [
    resolveInstallManifestPath(candidatePath),
    path.join(path.dirname(candidatePath), '..', 'install-manifest.json'),
    path.join(path.dirname(candidatePath), '..', '..', 'install-manifest.json'),
    path.join(path.dirname(candidatePath), '..', '..', '..', 'install-manifest.json'),
  ])

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

async function resolveExecutableFromShim(executablePath: string): Promise<string | undefined> {
  try {
    const raw = await readFile(executablePath, 'utf-8')
    const basedirUnixMatch =
      raw.match(/"\$basedir\/([^"\n]+)"/) ?? raw.match(/'\$basedir\/([^'\n]+)'/)
    if (basedirUnixMatch?.[1]) {
      return path.resolve(path.dirname(executablePath), basedirUnixMatch[1])
    }

    const basedirWindowsMatch =
      raw.match(/"%~dp0\\([^"\r\n]+)"/) ?? raw.match(/'%~dp0\\([^'\r\n]+)'/)
    if (basedirWindowsMatch?.[1]) {
      const normalizedRelativePath = basedirWindowsMatch[1].replace(/\\/g, path.sep)
      return path.resolve(path.dirname(executablePath), normalizedRelativePath)
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined
    }

    throw error
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
