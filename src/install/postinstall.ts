/**
 * @file src/install/postinstall.ts
 * @author michaeljou
 */

import os from 'node:os'
import path from 'node:path'

import { registerCurrentInstallation } from '@/install/install-index.js'
import { readPackageMetadata } from '@/install/package-info.js'

/**
 * npm postinstall 只在“当前目录不是开发仓库根目录”时登记安装元数据。
 *
 * 这样可以避免本地开发时执行 `pnpm install` 把工作副本误登记成正式安装实例。
 */
function shouldSkipRegistration(): boolean {
  const initCwd = process.env.INIT_CWD

  if (!initCwd) {
    return false
  }

  return path.resolve(initCwd) === process.cwd()
}

/**
 * 在 npm 安装结束后登记当前实例。
 *
 * 第一版只负责 npm 渠道：
 * - 写安装实例清单
 * - 更新用户级安装索引
 */
export async function runPostinstall(): Promise<void> {
  if (shouldSkipRegistration()) {
    return
  }

  const metadata = await readPackageMetadata()
  const installRoot = process.cwd()

  await registerCurrentInstallation({
    homeDir: os.homedir(),
    installMethod: 'npm',
    packageName: metadata.name,
    packageVersion: metadata.version,
    channel: 'stable',
    platform: process.platform,
    arch: process.arch,
    installRoot,
    executablePath: path.join(installRoot, 'dist', 'cli', 'run.js'),
    updateTarget: {
      npmPackage: metadata.name,
    },
  })
}

try {
  await runPostinstall()
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[FoxPilot] postinstall 记录安装信息失败\n${detail}\n`)
  process.exitCode = 1
}
