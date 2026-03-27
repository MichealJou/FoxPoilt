import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectMcpRegistry } from '@control-plane/control-plane-registry.js'

export type McpListArgs = {
  command: 'mcp'
  subcommand: 'list'
  help: boolean
  json: boolean
}

export type McpListDependencies = {
  collectMcpRegistry: typeof collectMcpRegistry
}

export type McpListContext = CliRuntimeContext<McpListDependencies>
