import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectControlPlaneOverview } from '@/control-plane/control-plane-registry.js'

export type ControlPlaneOverviewArgs = {
  command: 'control-plane'
  subcommand: 'overview'
  help: boolean
  json: boolean
}

export type ControlPlaneOverviewDependencies = {
  collectControlPlaneOverview: typeof collectControlPlaneOverview
}

export type ControlPlaneOverviewContext = CliRuntimeContext<ControlPlaneOverviewDependencies>
