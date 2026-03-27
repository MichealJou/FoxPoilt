import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { collectSkillRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

export type SkillsDoctorArgs = {
  command: 'skills'
  subcommand: 'doctor'
  help: boolean
  json: boolean
}

export type SkillsDoctorDependencies = {
  collectSkillRegistry: typeof collectSkillRegistry
}

export type SkillsDoctorContext = CliRuntimeContext<SkillsDoctorDependencies>
