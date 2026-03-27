import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { ProjectProfileId } from '@foxpilot/contracts/orchestration-contract.js'
import type { resolveManagedProject } from '@foxpilot/infra/project/resolve-project.js'
import type { resolveProjectPlatformResolution } from '@foxpilot/runtime/orchestrators/platform-resolver.js'

export type PlatformsResolveArgs = {
  command: 'platforms'
  subcommand: 'resolve'
  help: boolean
  json: boolean
  path?: string
  profile?: ProjectProfileId
}

export type PlatformsResolveDependencies = {
  resolveManagedProject: typeof resolveManagedProject
  resolvePlatformResolution: typeof resolveProjectPlatformResolution
}

export type PlatformsResolveContext = CliRuntimeContext<PlatformsResolveDependencies>
