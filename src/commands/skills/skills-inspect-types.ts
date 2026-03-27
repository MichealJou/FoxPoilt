import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectSkillRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

export type SkillsInspectArgs = {
  command: 'skills'
  subcommand: 'inspect'
  help: boolean
  json: boolean
  skill?: string
}

export type SkillsInspectDependencies = {
  collectSkillRegistry: typeof collectSkillRegistry
}

export type SkillsInspectContext = CliRuntimeContext<SkillsInspectDependencies>
