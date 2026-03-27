/**
 * @file src/commands/system/system-uninstall-command.ts
 * @author michaeljou
 */

import { rm } from 'node:fs/promises'
import path from 'node:path'

import type { CliResult } from '@/commands/init/init-types.js'
import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import { dispatchUninstall } from '@foxpilot/infra/install/uninstall-dispatcher.js'
import { readInstallManifest } from '@foxpilot/infra/install/install-manifest.js'
import { unregisterCurrentInstallation } from '@foxpilot/infra/install/install-index.js'
import { runBrewUninstall, runNpmUninstall, runReleaseUninstall } from '@foxpilot/infra/install/uninstall-runner.js'

import type {
  SystemUninstallArgs,
  SystemUninstallContext,
  SystemUninstallDependencies,
} from '@/commands/system/system-uninstall-types.js'

function buildHelpText(): string {
  return [
    '沿用当前命令实例来源执行卸载。',
    '使用 --purge 时，会额外删除 ~/.foxpilot 用户级数据目录。',
    '',
    'foxpilot uninstall',
    'foxpilot uninstall --purge',
    'fp uninstall',
    'fp uninstall --purge',
  ].join('\n')
}

async function purgeUserData({ homeDir }: { homeDir: string }): Promise<void> {
  await rm(path.join(homeDir, '.foxpilot'), {
    recursive: true,
    force: true,
  })
}

function getDependencies(
  context: SystemUninstallContext,
): SystemUninstallDependencies {
  return {
    readInstallManifest,
    dispatchUninstall: (manifest) =>
      dispatchUninstall(manifest, {
        runNpmUninstall,
        runBrewUninstall,
        runReleaseUninstall: (targetManifest) =>
          runReleaseUninstall(targetManifest, {
            platform: context.executablePath.endsWith('.cmd') ? 'win32' : process.platform,
            homeDir: context.homeDir,
          }),
      }),
    unregisterCurrentInstallation,
    purgeUserData,
    ...(context.dependencies ?? {}),
  }
}

/**
 * 执行统一 uninstall 命令。
 *
 * 这条命令分三步：
 * 1. 识别当前实例来源；
 * 2. 调用对应来源卸载策略；
 * 3. 清理用户级安装索引，必要时再清理整个 ~/.foxpilot。
 */
export async function runSystemUninstallCommand(
  args: SystemUninstallArgs,
  context: SystemUninstallContext,
): Promise<CliResult> {
  const commandName = 'uninstall'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(),
    }
  }

  const dependencies = getDependencies(context)
  const manifest = await dependencies.readInstallManifest({ executablePath: context.executablePath })

  if (!manifest) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'INSTALL_MANIFEST_NOT_FOUND',
            message: '无法识别当前安装来源',
            details: {
              executablePath: context.executablePath,
            },
          })
        : [
            '[FoxPilot] 无法识别当前安装来源',
            `- executablePath: ${context.executablePath}`,
          ].join('\n'),
    }
  }

  try {
    const strategy = await dependencies.dispatchUninstall(manifest)
    const unregisterResult = await dependencies.unregisterCurrentInstallation({
      homeDir: context.homeDir,
      manifest,
    })

    if (args.purge) {
      await dependencies.purgeUserData({ homeDir: context.homeDir })
    }

    const data = {
      installMethod: manifest.installMethod,
      packageVersion: manifest.packageVersion,
      purge: args.purge,
      remainingInstalls: unregisterResult.remainingCount,
      strategy,
    }

    return {
      exitCode: 0,
      stdout: args.json
        ? toJsonSuccessOutput(commandName, data)
        : [
            '[FoxPilot] 卸载完成',
            `- installMethod: ${manifest.installMethod}`,
            `- packageVersion: ${manifest.packageVersion}`,
            `- purge: ${args.purge ? 'true' : 'false'}`,
            `- remainingInstalls: ${unregisterResult.remainingCount}`,
            strategy,
          ].join('\n'),
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)

    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'UNINSTALL_FAILED',
            message: '卸载失败',
            details: {
              installMethod: manifest.installMethod,
              detail,
            },
          })
        : [
            '[FoxPilot] 卸载失败',
            `- installMethod: ${manifest.installMethod}`,
            detail,
          ].join('\n'),
    }
  }
}
