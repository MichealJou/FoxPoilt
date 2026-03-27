/**
 * @file src/install/postinstall.ts
 * @author michaeljou
 */

import os from 'node:os'
import path from 'node:path'

import { setupFoundationPack } from '@/foundation/foundation-installer.js'
import { registerCurrentInstallation } from '@/install/install-index.js'
import { readPackageMetadata } from '@/install/package-info.js'

/**
 * npm postinstall 只在“当前目录不是开发仓库根目录”时登记安装元数据。
 *
 * 这样可以避免本地开发时执行 `pnpm install` 把工作副本误登记成正式安装实例。
 */
function shouldSkipRegistration(cwd: string): boolean {
  const initCwd = process.env.INIT_CWD

  if (!initCwd) {
    return false
  }

  return path.resolve(initCwd) === cwd
}

type PostinstallDependencies = {
  registerCurrentInstallation: typeof registerCurrentInstallation
  readPackageMetadata: typeof readPackageMetadata
  setupFoundationPack: typeof setupFoundationPack
  stdout: Pick<NodeJS.WriteStream, 'write'>
}

function getDependencies(
  overrides: Partial<PostinstallDependencies> = {},
): PostinstallDependencies {
  return {
    registerCurrentInstallation,
    readPackageMetadata,
    setupFoundationPack,
    stdout: process.stdout,
    ...overrides,
  }
}

/**
 * 在 npm 安装结束后登记当前实例。
 *
 * 第一版只负责 npm 渠道：
 * - 写安装实例清单
 * - 更新用户级安装索引
 */
export async function runPostinstall(
  input: Partial<PostinstallDependencies> & {
    cwd?: string
    homeDir?: string
    executablePath?: string
  } = {},
): Promise<void> {
  const cwd = input.cwd ?? process.cwd()
  const homeDir = input.homeDir ?? os.homedir()
  const executablePath = input.executablePath ?? path.join(cwd, 'dist', 'cli', 'run.js')

  if (shouldSkipRegistration(cwd)) {
    return
  }

  const dependencies = getDependencies(input)
  const metadata = await dependencies.readPackageMetadata()
  const installRoot = cwd

  await dependencies.registerCurrentInstallation({
    homeDir,
    installMethod: 'npm',
    packageName: metadata.name,
    packageVersion: metadata.version,
    channel: 'stable',
    platform: process.platform,
    arch: process.arch,
    installRoot,
    executablePath,
    updateTarget: {
      npmPackage: metadata.name,
    },
  })

  const foundation = await dependencies.setupFoundationPack({
    homeDir,
    platform: process.platform,
  })

  dependencies.stdout.write(
    [
      '[FoxPilot] Foundation Pack',
      `- foundationPack: ${foundation.items.map((item) => item.tool).join(', ')}`,
      `- ready: ${foundation.ready.length > 0 ? foundation.ready.join(', ') : 'none'}`,
      `- installed: ${foundation.installed.length > 0 ? foundation.installed.join(', ') : 'none'}`,
      `- missing: ${foundation.missing.length > 0 ? foundation.missing.join(', ') : 'none'}`,
    ].join('\n') + '\n',
  )
}

try {
  await runPostinstall()
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[FoxPilot] postinstall 记录安装信息失败\n${detail}\n`)
  process.exitCode = 1
}
