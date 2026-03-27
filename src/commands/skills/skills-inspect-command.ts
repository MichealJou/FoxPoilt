import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { collectSkillRegistry } from '@/control-plane/control-plane-registry.js'

import type {
  SkillsInspectArgs,
  SkillsInspectContext,
  SkillsInspectDependencies,
} from '@/commands/skills/skills-inspect-types.js'

function getDependencies(
  overrides: Partial<SkillsInspectDependencies> = {},
): SkillsInspectDependencies {
  return {
    collectSkillRegistry,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '查看单个 Skill 的注册详情。',
    '',
    `${binName} skills inspect --skill architecture-designer`,
    `${binName} skills inspect --skill architecture-designer --json`,
  ].join('\n')
}

export async function runSkillsInspectCommand(
  args: SkillsInspectArgs,
  context: SkillsInspectContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  if (!args.skill) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput('skills inspect', {
            code: 'SKILL_ID_REQUIRED',
            message: '缺少 --skill。',
          })
        : '[FoxPilot] skills inspect 失败: 缺少 --skill',
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const items = await dependencies.collectSkillRegistry({
    homeDir: context.homeDir,
  })
  const skill = items.find((item) => item.skillId === args.skill)

  if (!skill) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput('skills inspect', {
            code: 'SKILL_NOT_FOUND',
            message: '未找到指定 Skill。',
            details: {
              skillId: args.skill,
            },
          })
        : `[FoxPilot] skills inspect 失败: 未找到 Skill ${args.skill}`,
    }
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput('skills inspect', {
        skill,
      }),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      `[FoxPilot] Skill ${skill.skillId}`,
      `- status: ${skill.status}`,
      `- source: ${skill.source}`,
      `- version: ${skill.version ?? 'unknown'}`,
      `- installPath: ${skill.installPath ?? 'unknown'}`,
      `- manifestPath: ${skill.manifestPath ?? 'unknown'}`,
    ].join('\n'),
  }
}
