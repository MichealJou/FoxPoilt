import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectPlatformRegistry } from '@control-plane/control-plane-registry.js'

export type PlatformsDoctorArgs = {
  command: 'platforms'
  subcommand: 'doctor'
  help: boolean
  json: boolean
}

export type PlatformsDoctorDependencies = {
  collectPlatformRegistry: typeof collectPlatformRegistry
}

export type PlatformsDoctorContext = CliRuntimeContext<PlatformsDoctorDependencies>
