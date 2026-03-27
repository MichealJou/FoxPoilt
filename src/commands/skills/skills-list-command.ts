import { toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectSkillRegistry } from '@foxpilot/runtime/read-models/control-plane-registry.js'

import type {
  SkillsListArgs,
  SkillsListContext,
  SkillsListDependencies,
} from '@/commands/skills/skills-list-types.js'

function getDependencies(overrides: Partial<SkillsListDependencies> = {}): SkillsListDependencies {
  return {
    collectSkillRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '列出当前识别到的 Skills 注册表。',
    '',
    `${binName} skills list`,
    `${binName} skills list --json`,
  ].join('\n')
}

export async function runSkillsListCommand(
  args: SkillsListArgs,
  context: SkillsListContext,
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

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('skills list', {
        items,
        total: items.length,
      }),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      '[FoxPilot] Skills',
      ...items.map(
        (item) => `- ${item.skillId}: ${item.status}${item.version ? ` (${item.version})` : ''}`,
      ),
    ].join('\n'),
  }
}
