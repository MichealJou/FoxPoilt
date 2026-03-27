import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectPlatformRegistry } from '@/control-plane/control-plane-registry.js'

export type PlatformsCapabilitiesArgs = {
  command: 'platforms'
  subcommand: 'capabilities'
  help: boolean
  json: boolean
  platform?: string
}

export type PlatformsCapabilitiesDependencies = {
  collectPlatformRegistry: typeof collectPlatformRegistry
}

export type PlatformsCapabilitiesContext = CliRuntimeContext<PlatformsCapabilitiesDependencies>
