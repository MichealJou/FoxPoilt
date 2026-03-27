/**
 * @file src/install/postinstall.ts
 * @author michaeljou
 */

import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCurrentInstallation } from '@foxpilot/infra/install/install-index.js'
import { readPackageMetadata } from '@foxpilot/infra/install/package-info.js'

/**
 * npm postinstall 只在“当前包根目录不是开发仓库根目录”时登记安装元数据。
 *
 * 这样可以避免本地开发时执行 `pnpm install` 把工作副本误登记成正式安装实例。
 */
function shouldSkipRegistration(packageRoot: string): boolean {
  const initCwd = process.env.INIT_CWD

  if (!initCwd) {
    return false
  }

  return path.resolve(initCwd) === packageRoot
}

function resolvePackageRoot(): string {
  const rootCandidates = [
    fileURLToPath(new URL('../../../../../', import.meta.url)),
    fileURLToPath(new URL('../../../../apps/cli/', import.meta.url)),
    fileURLToPath(new URL('../../../../', import.meta.url)),
  ]

  for (const candidate of rootCandidates) {
    if (existsSync(path.join(candidate, 'package.json'))) {
      return path.resolve(candidate)
    }
  }

  return path.resolve(rootCandidates[0])
}

function shouldSkipFoundationSetup(): boolean {
  return process.env.FOXPILOT_SKIP_FOUNDATION_PACK === '1'
}

type PostinstallDependencies = {
  registerCurrentInstallation: typeof registerCurrentInstallation
  readPackageMetadata: typeof readPackageMetadata
  setupFoundationPack: (context: { homeDir: string; platform: NodeJS.Platform }) => Promise<{
    items: Array<{ tool: string }>
    ready: string[]
    installed: string[]
    missing: string[]
  }>
  stdout: Pick<NodeJS.WriteStream, 'write'>
}

function getDependencies(
  overrides: Partial<PostinstallDependencies> = {},
): PostinstallDependencies {
  if (!overrides.setupFoundationPack) {
    throw new Error('Missing setupFoundationPack dependency')
  }

  return {
    registerCurrentInstallation,
    readPackageMetadata,
    stdout: process.stdout,
    ...overrides,
    setupFoundationPack: overrides.setupFoundationPack,
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
    packageRoot?: string
  } = {},
): Promise<void> {
  const homeDir = input.homeDir ?? os.homedir()
  const packageRoot = input.packageRoot ?? resolvePackageRoot()
  const executablePath =
    input.executablePath ?? path.join(packageRoot, 'dist', 'src', 'cli', 'run.js')

  if (shouldSkipRegistration(packageRoot)) {
    return
  }

  const dependencies = getDependencies(input)
  const metadata = await dependencies.readPackageMetadata()
  const installRoot = packageRoot

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

  if (shouldSkipFoundationSetup()) {
    dependencies.stdout.write(
      [
        '[FoxPilot] Foundation Pack',
        '- skipped: true',
        '- reason: FOXPILOT_SKIP_FOUNDATION_PACK=1',
      ].join('\n') + '\n',
    )
    return
  }

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
