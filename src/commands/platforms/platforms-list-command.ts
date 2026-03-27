import { toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectPlatformRegistry } from '@/control-plane/control-plane-registry.js'

import type {
  PlatformsListArgs,
  PlatformsListContext,
  PlatformsListDependencies,
} from '@/commands/platforms/platforms-list-types.js'

function getDependencies(
  overrides: Partial<PlatformsListDependencies> = {},
): PlatformsListDependencies {
  return {
    collectPlatformRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '列出当前可识别的平台注册表。',
    '',
    `${binName} platforms list`,
    `${binName} platforms list --json`,
  ].join('\n')
}

export async function runPlatformsListCommand(
  args: PlatformsListArgs,
  context: PlatformsListContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const items = await dependencies.collectPlatformRegistry()

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('platforms list', {
        items,
        total: items.length,
      }),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] Platforms',
      ...items.map((item) => `- ${item.platformId}: ${item.status}${item.command ? ` (${item.command})` : ''}`),
    ].join('\n'),
  }
}
