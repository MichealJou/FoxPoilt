/**
 * @file src/install/register-installation.ts
 * @author michaeljou
 */

import os from 'node:os'

import { registerCurrentInstallation } from '@foxpilot/infra/install/install-index.js'
import { readPackageMetadata } from '@foxpilot/infra/install/package-info.js'
import { buildReleaseAssetName } from '@foxpilot/infra/install/release-asset.js'
import type { InstallManifest } from '@foxpilot/infra/install/install-types.js'

type RegisterInstallArgs = {
  method?: InstallManifest['installMethod']
  installRoot?: string
  executablePath?: string
  channel: string
}

function parseArgs(argv: string[]): RegisterInstallArgs {
  const result: RegisterInstallArgs = {
    channel: 'stable',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    if (value === '--method') {
      const nextValue = argv[index + 1]
      if (nextValue === 'npm' || nextValue === 'brew' || nextValue === 'release') {
        result.method = nextValue
      }
      index += 1
      continue
    }

    if (value === '--install-root') {
      result.installRoot = argv[index + 1]
      index += 1
      continue
    }

    if (value === '--executable-path') {
      result.executablePath = argv[index + 1]
      index += 1
      continue
    }

    if (value === '--channel') {
      result.channel = argv[index + 1] ?? 'stable'
      index += 1
    }
  }

  return result
}

function resolveUpdateTarget(
  method: InstallManifest['installMethod'],
  packageName: string,
): InstallManifest['updateTarget'] {
  if (method === 'npm') {
    return {
      npmPackage: packageName,
    }
  }

  if (method === 'brew') {
    return {
      brewTap: 'michealjou/tap',
      brewFormula: 'foxpilot',
    }
  }

  return {
    releaseAsset: buildReleaseAssetName({
      platform: process.platform,
      arch: process.arch,
    }),
  }
}

/**
 * 统一的安装登记入口。
 *
 * npm postinstall、release 安装脚本和未来的 brew 安装补录，都可以复用这份逻辑。
 */
export async function runRegisterInstallation(argv: string[]): Promise<void> {
  const args = parseArgs(argv)

  if (!args.method || !args.installRoot || !args.executablePath) {
    throw new Error('Missing required install registration arguments')
  }

  const metadata = await readPackageMetadata()

  await registerCurrentInstallation({
    homeDir: os.homedir(),
    installMethod: args.method,
    packageName: metadata.name,
    packageVersion: metadata.version,
    channel: args.channel,
    platform: process.platform,
    arch: process.arch,
    installRoot: args.installRoot,
    executablePath: args.executablePath,
    updateTarget: resolveUpdateTarget(args.method, metadata.name),
  })
}

try {
  await runRegisterInstallation(process.argv.slice(2))
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[FoxPilot] 安装登记失败\n${detail}\n`)
  process.exitCode = 1
}
