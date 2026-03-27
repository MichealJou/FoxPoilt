/**
 * @file src/install/package-info.ts
 * @author michaeljou
 */

import { readFile } from 'node:fs/promises'

function resolvePackageJsonCandidates(): URL[] {
  return [
    new URL('../../../../../package.json', import.meta.url),
    new URL('../../../../apps/cli/package.json', import.meta.url),
    new URL('../../../../package.json', import.meta.url),
  ]
}

/**
 * 从包根目录读取当前包元数据。
 *
 * 这里不把包名和版本硬编码进源码，而是直接读取包根目录的 `package.json`，
 * 让 npm 发布、打包验证和本地开发都围绕同一个事实源工作。
 */
export async function readPackageMetadata(): Promise<{
  name: string
  version: string
}> {
  let lastError: unknown

  for (const packageJsonUrl of resolvePackageJsonCandidates()) {
    try {
      const raw = await readFile(packageJsonUrl, 'utf-8')
      const parsed = JSON.parse(raw) as { name?: string; version?: string }

      return {
        name: parsed.name ?? 'foxpilot',
        version: parsed.version ?? '0.0.0',
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Missing foxpilot package.json')
}

/**
 * 只读取版本号的轻量包装。
 */
export async function readPackageVersion(): Promise<string> {
  const metadata = await readPackageMetadata()
  return metadata.version
}
