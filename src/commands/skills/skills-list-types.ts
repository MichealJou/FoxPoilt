import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectSkillRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

export type SkillsListArgs = {
  command: 'skills'
  subcommand: 'list'
  help: boolean
  json: boolean
}

export type SkillsListDependencies = {
  collectSkillRegistry: typeof collectSkillRegistry
}

export type SkillsListContext = CliRuntimeContext<SkillsListDependencies>
