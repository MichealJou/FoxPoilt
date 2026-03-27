import { toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectControlPlaneOverview } from '@/control-plane/control-plane-registry.js'

import type {
  ControlPlaneOverviewArgs,
  ControlPlaneOverviewContext,
  ControlPlaneOverviewDependencies,
} from '@/commands/control-plane/control-plane-overview-types.js'

function getDependencies(
  overrides: Partial<ControlPlaneOverviewDependencies> = {},
): ControlPlaneOverviewDependencies {
  return {
    collectControlPlaneOverview,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '显示 FoxPilot 中控平台总览。',
    '',
    `${binName} control-plane overview`,
    `${binName} control-plane overview --json`,
  ].join('\n')
}

export async function runControlPlaneOverviewCommand(
  args: ControlPlaneOverviewArgs,
  context: ControlPlaneOverviewContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const overview = await dependencies.collectControlPlaneOverview({
    homeDir: context.homeDir,
  })

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('control-plane overview', overview),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] Control Plane Overview',
      `- platforms: ${overview.summary.platformCount}`,
      `- skills: ${overview.summary.skillCount}`,
      `- mcp: ${overview.summary.mcpCount}`,
      `- ready: ${overview.summary.readyCount}`,
      `- degraded: ${overview.summary.degradedCount}`,
      `- unavailable: ${overview.summary.unavailableCount}`,
    ].join('\n'),
  }
}
