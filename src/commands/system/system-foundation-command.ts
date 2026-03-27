/**
 * @file src/commands/system/system-foundation-command.ts
 * @author michaeljou
 */

import { toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { runFoundationDoctor } from '@foxpilot/integrations/foundation/foundation-doctor.js'

import type {
  SystemFoundationArgs,
  SystemFoundationContext,
  SystemFoundationDependencies,
} from '@/commands/system/system-foundation-types.js'

function getDependencies(
  overrides: Partial<SystemFoundationDependencies> = {},
): SystemFoundationDependencies {
  return {
    runFoundationDoctor,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '检查安装阶段基础组合的当前状态。',
    '',
    `${binName} foundation`,
  ].join('\n')
}

export async function runSystemFoundationCommand(
  args: SystemFoundationArgs,
  context: SystemFoundationContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const result = await dependencies.runFoundationDoctor()

  return {
    exitCode: 0,
    stdout: args.json
      ? toJsonSuccessOutput('foundation', result)
      : [
          '[FoxPilot] Foundation Pack',
          `- packId: ${result.packId}`,
          `- ready: ${result.ready.length > 0 ? result.ready.join(', ') : 'none'}`,
          `- missing: ${result.missing.length > 0 ? result.missing.join(', ') : 'none'}`,
          ...result.items.map((item) =>
            `- ${item.tool}: ${item.status}${item.version ? ` (${item.version})` : ''}`,
          ),
        ].join('\n'),
  }
}
