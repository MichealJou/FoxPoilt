import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import type { ProjectProfileId } from '@contracts/orchestration-contract.js'
import {
  ProjectNotInitializedError,
  resolveManagedProject,
} from '@infra/project/resolve-project.js'
import { resolveProjectPlatformResolution } from '@runtime/orchestrators/platform-resolver.js'

import type {
  PlatformsResolveArgs,
  PlatformsResolveContext,
  PlatformsResolveDependencies,
} from '@/commands/platforms/platforms-resolve-types.js'

function getDependencies(
  overrides: Partial<PlatformsResolveDependencies> = {},
): PlatformsResolveDependencies {
  return {
    resolveManagedProject,
    resolvePlatformResolution: resolveProjectPlatformResolution,
    ...overrides,
  }
}

function buildHelpText(binName: 'foxpilot' | 'fp'): string {
  return [
    '查看当前项目的阶段 / 角色 / 平台解析结果。',
    '',
    `${binName} platforms resolve`,
    `${binName} platforms resolve --path . --json`,
    `${binName} platforms resolve --profile collaboration --json`,
  ].join('\n')
}

function buildResolveReasons(input: {
  profile: ProjectProfileId
  recommended: string
  effective: string
  source: string
}): string[] {
  if (input.source === 'auto-detect') {
    return [`自动检测命中 ${input.effective}`]
  }

  if (input.source === 'profile-rule') {
    return [`profile ${input.profile} 要求人工接管`]
  }

  if (input.source === 'fallback') {
    return [`未检测到 ${input.recommended}，已回退 manual`]
  }

  return [`来源: ${input.source}`]
}

export async function runPlatformsResolveCommand(
  args: PlatformsResolveArgs,
  context: PlatformsResolveContext,
): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.binName),
    }
  }

  const dependencies = getDependencies(context.dependencies)

  try {
    const project = await dependencies.resolveManagedProject({
      cwd: context.cwd,
      projectPath: args.path,
    })

    const selectedProfile = args.profile ?? project.projectConfig.orchestration.profile.selected
    const resolution = await dependencies.resolvePlatformResolution({
      profile: selectedProfile,
    })

    const data = {
      projectId: project.projectConfig.name,
      projectRoot: project.projectRoot,
      selectedProfile,
      generatedAt: resolution.generatedAt,
      stages: resolution.stages.map((stage) => ({
        stage: stage.stage,
        role: stage.role,
        recommendedPlatform: stage.platform.recommended,
        effectivePlatform: stage.platform.effective,
        source: stage.platform.source,
        reasons: buildResolveReasons({
          profile: selectedProfile,
          recommended: stage.platform.recommended,
          effective: stage.platform.effective,
          source: stage.platform.source,
        }),
      })),
    }

    if (args.json) {
      return {
        exitCode: 0,
        stdout: toJsonSuccessOutput('platforms resolve', data),
      }
    }

    return {
      exitCode: 0,
      stdout: [
        `[FoxPilot] Platforms Resolve`,
        `- project: ${project.projectConfig.name}`,
        `- profile: ${selectedProfile}`,
        ...data.stages.map(
          (stage) =>
            `- ${stage.stage}: ${stage.role} -> ${stage.effectivePlatform} (${stage.source})`,
        ),
      ].join('\n'),
    }
  } catch (error) {
    if (error instanceof ProjectNotInitializedError) {
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput('platforms resolve', {
              code: 'PROJECT_NOT_INITIALIZED',
              message: '当前目录不在已初始化项目中。',
              details: {
                projectRoot: error.projectRoot,
                configPath: error.configPath,
              },
            })
          : '[FoxPilot] platforms resolve 失败: 当前目录不在已初始化项目中',
      }
    }

    throw error
  }
}
