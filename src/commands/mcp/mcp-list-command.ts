import { toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectMcpRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

import type {
  McpListArgs,
  McpListContext,
  McpListDependencies,
} from '@/commands/mcp/mcp-list-types.js'

function getDependencies(
  overrides: Partial<McpListDependencies> = {},
): McpListDependencies {
  return {
    collectMcpRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '列出当前识别到的 MCP 注册表。',
    '',
    `${binName} mcp list`,
    `${binName} mcp list --json`,
  ].join('\n')
}

export async function runMcpListCommand(
  args: McpListArgs,
  context: McpListContext,
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

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('mcp list', {
        items,
        total: items.length,
      }),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] MCP',
      ...items.map((item) =>
        `- ${item.serverId}: ${item.status}${item.command ? ` (${item.command})` : item.url ? ` (${item.url})` : ''}`,
      ),
    ].join('\n'),
  }
}
