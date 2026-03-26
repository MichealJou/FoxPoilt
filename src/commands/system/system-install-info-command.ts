/**
 * @file src/commands/system/system-install-info-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { readInstallIndex, readInstallManifest } from '@/install/install-manifest.js'

import type {
  SystemInstallInfoArgs,
  SystemInstallInfoContext,
  SystemInstallInfoDependencies,
} from '@/commands/system/system-install-info-types.js'

function getDependencies(
  overrides: Partial<SystemInstallInfoDependencies> = {},
): SystemInstallInfoDependencies {
  return {
    readInstallManifest,
    readInstallIndex,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '显示当前命令实例的安装来源和已登记安装列表。',
    '',
    `${binName} install-info`,
  ].join('\n')
}

/**
 * 输出当前命令实例的安装信息。
 */
export async function runSystemInstallInfoCommand(
  args: SystemInstallInfoArgs,
  context: SystemInstallInfoContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const [manifest, installIndex] = await Promise.all([
    dependencies.readInstallManifest({ executablePath: context.executablePath }),
    dependencies.readInstallIndex({ homeDir: context.homeDir }),
  ])

  if (!manifest) {
    return {
      exitCode: 0,
      stdout: [
        '[FoxPilot] 当前安装信息',
        '- installMethod: unknown',
        '- packageVersion: unknown',
        `- executablePath: ${context.executablePath}`,
        `- registeredInstalls: ${installIndex.length}`,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] 当前安装信息',
      `- installMethod: ${manifest.installMethod}`,
      `- packageVersion: ${manifest.packageVersion}`,
      `- channel: ${manifest.channel}`,
      `- platform: ${manifest.platform}`,
      `- arch: ${manifest.arch}`,
      `- installRoot: ${manifest.installRoot}`,
      `- binPath: ${manifest.binPath}`,
      `- registeredInstalls: ${installIndex.length}`,
    ].join('\n'),
  }
}
