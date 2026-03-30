import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectPlatformRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

export type PlatformsInspectArgs = {
  command: 'platforms'
  subcommand: 'inspect'
  help: boolean
  json: boolean
  platform?: string
}

export type PlatformsInspectDependencies = {
  collectPlatformRegistry: typeof collectPlatformRegistry
}

export type PlatformsInspectContext = CliRuntimeContext<PlatformsInspectDependencies>
