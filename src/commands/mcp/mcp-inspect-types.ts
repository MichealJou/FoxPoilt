import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectMcpRegistry } from '@control-plane/control-plane-registry.js'

export type McpInspectArgs = {
  command: 'mcp'
  subcommand: 'inspect'
  help: boolean
  json: boolean
  server?: string
}

export type McpInspectDependencies = {
  collectMcpRegistry: typeof collectMcpRegistry
}

export type McpInspectContext = CliRuntimeContext<McpInspectDependencies>
