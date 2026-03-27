import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectPlatformRegistry } from '@control-plane/control-plane-registry.js'

export type PlatformsListArgs = {
  command: 'platforms'
  subcommand: 'list'
  help: boolean
  json: boolean
}

export type PlatformsListDependencies = {
  collectPlatformRegistry: typeof collectPlatformRegistry
}

export type PlatformsListContext = CliRuntimeContext<PlatformsListDependencies>
