/**
 * @file src/commands/system/system-update-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import { dispatchUpdate } from '@/install/update-dispatcher.js'
import { readInstallManifest } from '@/install/install-manifest.js'
import { runBrewUpdate, runNpmUpdate, runReleaseUpdate } from '@/install/update-runner.js'

import type { SystemUpdateArgs, SystemUpdateContext, SystemUpdateDependencies } from '@/commands/system/system-update-types.js'

function getDependencies(
  overrides: Partial<SystemUpdateDependencies> = {},
): SystemUpdateDependencies {
  return {
    readInstallManifest,
    dispatchUpdate: (manifest) =>
      dispatchUpdate(manifest, {
        runNpmUpdate,
        runBrewUpdate,
        runReleaseUpdate,
      }),
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '沿用当前命令实例来源执行更新。',
    '',
    `${binName} update`,
  ].join('\n')
}

/**
 * 执行统一 update 命令。
 *
 * 第一批实现先把“来源识别”和“策略分派”打通，
 * 暂时不直接执行真实的包管理器升级动作。
 */
export async function runSystemUpdateCommand(
  args: SystemUpdateArgs,
  context: SystemUpdateContext,
): Promise<CliResult> {
  const commandName = 'update'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const dependencies = getDependencies(context.dependencies)
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

  const strategy = await dependencies.dispatchUpdate(manifest)
  const data = {
    installMethod: manifest.installMethod,
    packageVersion: manifest.packageVersion,
    strategy,
  }

  return {
    exitCode: 0,
    stdout: args.json
      ? toJsonSuccessOutput(commandName, data)
      : [
          '[FoxPilot] 更新策略已解析',
          `- installMethod: ${manifest.installMethod}`,
          `- packageVersion: ${manifest.packageVersion}`,
          strategy,
        ].join('\n'),
  }
}
