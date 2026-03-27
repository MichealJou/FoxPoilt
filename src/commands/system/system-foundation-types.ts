/**
 * @file src/commands/system/system-foundation-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { runFoundationDoctor } from '@/foundation/foundation-doctor.js'

export type SystemFoundationArgs = {
  command: 'foundation'
  help: boolean
  json: boolean
}

export type SystemFoundationDependencies = {
  runFoundationDoctor: typeof runFoundationDoctor
}

export type SystemFoundationContext = CliRuntimeContext<SystemFoundationDependencies>
