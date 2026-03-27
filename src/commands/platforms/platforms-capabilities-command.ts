import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectPlatformRegistry } from '@/control-plane/control-plane-registry.js'

import type {
  PlatformsCapabilitiesArgs,
  PlatformsCapabilitiesContext,
  PlatformsCapabilitiesDependencies,
} from '@/commands/platforms/platforms-capabilities-types.js'

function getDependencies(
  overrides: Partial<PlatformsCapabilitiesDependencies> = {},
): PlatformsCapabilitiesDependencies {
  return {
    collectPlatformRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '查看单个平台的能力矩阵。',
    '',
    `${binName} platforms capabilities --platform codex`,
    `${binName} platforms capabilities --platform codex --json`,
  ].join('\n')
}

export async function runPlatformsCapabilitiesCommand(
  args: PlatformsCapabilitiesArgs,
  context: PlatformsCapabilitiesContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  if (!args.platform) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput('platforms capabilities', {
            code: 'PLATFORM_ID_REQUIRED',
            message: '缺少 --platform。',
          })
        : '[FoxPilot] platforms capabilities 失败: 缺少 --platform',
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const items = await dependencies.collectPlatformRegistry()
  const platform = items.find((item) => item.platformId === args.platform)

  if (!platform) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput('platforms capabilities', {
            code: 'PLATFORM_NOT_FOUND',
            message: '未找到指定平台。',
            details: {
              platformId: args.platform,
            },
          })
        : `[FoxPilot] platforms capabilities 失败: 未找到平台 ${args.platform}`,
    }
  }

  const data = {
    platformId: platform.platformId,
    capabilities: platform.capabilities.map((name) => ({
      name,
      supportedStages: platform.supportedStages,
      supportedRoles: platform.recommendedRoles,
    })),
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('platforms capabilities', data),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      `[FoxPilot] Platform Capabilities ${platform.platformId}`,
      `- capabilities: ${platform.capabilities.join(', ')}`,
      `- stages: ${platform.supportedStages.join(', ')}`,
      `- roles: ${platform.recommendedRoles.join(', ')}`,
    ].join('\n'),
  }
}
