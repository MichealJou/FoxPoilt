/**
 * @file src/commands/system/system-version-command.ts
 * @author michaeljou
 */

import type { CliResult } from '@/commands/init/init-types.js'
import { readPackageVersion } from '@/install/package-info.js'

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
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const version = await readPackageVersion()

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] 当前版本',
      '- name: foxpilot',
      `- version: ${version}`,
      `- binName: ${context.binName}`,
    ].join('\n'),
  }
}
