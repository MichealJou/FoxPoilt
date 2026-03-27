import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectMcpRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

import type {
  McpInspectArgs,
  McpInspectContext,
  McpInspectDependencies,
} from '@/commands/mcp/mcp-inspect-types.js'

function getDependencies(overrides: Partial<McpInspectDependencies> = {}): McpInspectDependencies {
  return {
    collectMcpRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '查看单个 MCP server 的注册详情。',
    '',
    `${binName} mcp inspect --server github`,
    `${binName} mcp inspect --server github --json`,
  ].join('\n')
}

export async function runMcpInspectCommand(
  args: McpInspectArgs,
  context: McpInspectContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  if (!args.server) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput('mcp inspect', {
            code: 'MCP_SERVER_ID_REQUIRED',
            message: '缺少 --server。',
          })
        : '[FoxPilot] mcp inspect 失败: 缺少 --server',
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const items = await dependencies.collectMcpRegistry({
    homeDir: context.homeDir,
  })
  const server = items.find((item) => item.serverId === args.server)

  if (!server) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput('mcp inspect', {
            code: 'MCP_SERVER_NOT_FOUND',
            message: '未找到指定 MCP server。',
            details: {
              serverId: args.server,
            },
          })
        : `[FoxPilot] mcp inspect 失败: 未找到 MCP server ${args.server}`,
    }
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('mcp inspect', {
        server,
      }),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      `[FoxPilot] MCP ${server.serverId}`,
      `- status: ${server.status}`,
      `- transport: ${server.transport}`,
      `- command: ${server.command ?? 'unknown'}`,
      `- url: ${server.url ?? 'unknown'}`,
      `- configPath: ${server.configPath ?? 'unknown'}`,
    ].join('\n'),
  }
}
