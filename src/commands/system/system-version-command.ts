/**
 * @file src/commands/system/system-version-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { toJsonSuccessOutput } from '@/cli/json-output.js'
import { readPackageVersion } from '@foxpilot/infra/install/package-info.js'

import type { SystemVersionArgs, SystemVersionContext } from '@/commands/system/system-version-types.js'

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '显示当前 FoxPilot CLI 版本信息。',
    '',
    `${binName} version`,
  ].join('\n')
}

/**
 * 输出当前命令版本信息。
 */
export async function runSystemVersionCommand(
  args: SystemVersionArgs,
  context: SystemVersionContext,
): Promise<CliResult> {
  const commandName = 'version'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const version = await readPackageVersion()
  const data = {
    name: 'foxpilot',
    version,
    binName: context.binName,
  }

  return {
    exitCode: 0,
    stdout: args.json
      ? toJsonSuccessOutput(commandName, data)
      : [
          '[FoxPilot] 当前版本',
          '- name: foxpilot',
          `- version: ${version}`,
          `- binName: ${context.binName}`,
        ].join('\n'),
  }
}
