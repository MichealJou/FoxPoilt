import { toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectMcpRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

import type {
  McpDoctorArgs,
  McpDoctorContext,
  McpDoctorDependencies,
} from '@/commands/mcp/mcp-doctor-types.js'

function getDependencies(
  overrides: Partial<McpDoctorDependencies> = {},
): McpDoctorDependencies {
  return {
    collectMcpRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '查看 MCP 层健康检查摘要。',
    '',
    `${binName} mcp doctor`,
    `${binName} mcp doctor --json`,
  ].join('\n')
}

export async function runMcpDoctorCommand(
  args: McpDoctorArgs,
  context: McpDoctorContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const items = await dependencies.collectMcpRegistry({
    homeDir: context.homeDir,
  })

  const data = {
    summary: {
      ready: items.filter((item) => item.status === 'ready').length,
      degraded: items.filter((item) => item.status === 'degraded').length,
      unavailable: items.filter((item) => item.status === 'unavailable').length,
    },
    items: items.map((item) => ({
      serverId: item.serverId,
      status: item.status,
      issues: item.healthSummary ? [item.healthSummary] : [],
      suggestedActions: item.availableActions,
    })),
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('mcp doctor', data),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] MCP Doctor',
      `- ready: ${data.summary.ready}`,
      `- degraded: ${data.summary.degraded}`,
      `- unavailable: ${data.summary.unavailable}`,
    ].join('\n'),
  }
}
