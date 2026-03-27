import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectMcpRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

export type McpDoctorArgs = {
  command: 'mcp'
  subcommand: 'doctor'
  help: boolean
  json: boolean
}

export type McpDoctorDependencies = {
  collectMcpRegistry: typeof collectMcpRegistry
}

export type McpDoctorContext = CliRuntimeContext<McpDoctorDependencies>
