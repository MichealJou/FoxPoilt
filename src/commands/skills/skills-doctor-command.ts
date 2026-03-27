import { toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectSkillRegistry } from '@control-plane/control-plane-registry.js'

import type {
  SkillsDoctorArgs,
  SkillsDoctorContext,
  SkillsDoctorDependencies,
} from '@/commands/skills/skills-doctor-types.js'

function getDependencies(
  overrides: Partial<SkillsDoctorDependencies> = {},
): SkillsDoctorDependencies {
  return {
    collectSkillRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '查看 Skills 层健康检查摘要。',
    '',
    `${binName} skills doctor`,
    `${binName} skills doctor --json`,
  ].join('\n')
}

export async function runSkillsDoctorCommand(
  args: SkillsDoctorArgs,
  context: SkillsDoctorContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const items = await dependencies.collectSkillRegistry({
    homeDir: context.homeDir,
  })

  const data = {
    summary: {
      ready: items.filter((item) => item.status === 'ready').length,
      degraded: items.filter((item) => item.status === 'degraded').length,
      unavailable: items.filter((item) => item.status === 'unavailable').length,
    },
    items: items.map((item) => ({
      skillId: item.skillId,
      status: item.status,
      issues: item.healthSummary ? [item.healthSummary] : [],
      suggestedActions: item.availableActions,
    })),
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('skills doctor', data),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] Skills Doctor',
      `- ready: ${data.summary.ready}`,
      `- degraded: ${data.summary.degraded}`,
      `- unavailable: ${data.summary.unavailable}`,
    ].join('\n'),
  }
}
