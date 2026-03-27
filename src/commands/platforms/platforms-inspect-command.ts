import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectPlatformRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

import type {
  PlatformsInspectArgs,
  PlatformsInspectContext,
  PlatformsInspectDependencies,
} from '@/commands/platforms/platforms-inspect-types.js'

function getDependencies(
  overrides: Partial<PlatformsInspectDependencies> = {},
): PlatformsInspectDependencies {
  return {
    collectPlatformRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '查看单个平台的注册详情。',
    '',
    `${binName} platforms inspect --platform codex`,
    `${binName} platforms inspect --platform codex --json`,
  ].join('\n')
}

export async function runPlatformsInspectCommand(
  args: PlatformsInspectArgs,
  context: PlatformsInspectContext,
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
        ? toJsonErrorOutput('platforms inspect', {
            code: 'PLATFORM_ID_REQUIRED',
            message: '缺少 --platform。',
          })
        : '[FoxPilot] platforms inspect 失败: 缺少 --platform',
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const items = await dependencies.collectPlatformRegistry()
  const platform = items.find((item) => item.platformId === args.platform)

  if (!platform) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput('platforms inspect', {
            code: 'PLATFORM_NOT_FOUND',
            message: '未找到指定平台。',
            details: {
              platformId: args.platform,
            },
          })
        : `[FoxPilot] platforms inspect 失败: 未找到平台 ${args.platform}`,
    }
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('platforms inspect', {
        platform,
      }),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      `[FoxPilot] Platform ${platform.platformId}`,
      `- status: ${platform.status}`,
      `- source: ${platform.source}`,
      `- command: ${platform.command ?? 'unknown'}`,
      `- version: ${platform.version ?? 'unknown'}`,
      `- stages: ${platform.supportedStages.join(', ')}`,
      `- roles: ${platform.recommendedRoles.join(', ')}`,
    ].join('\n'),
  }
}
