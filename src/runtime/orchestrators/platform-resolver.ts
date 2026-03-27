/**
 * @file src/runtime/orchestrators/platform-resolver.ts
 * @author michaeljou
 */

import { spawn } from 'node:child_process'

import type {
  DetectablePlatformId,
  PlatformId,
  ProjectOrchestrationConfig,
  ProjectProfileId,
  ProjectRoleId,
  ProjectStageId,
} from '@/contracts/orchestration-contract.js'

type StagePlatformSeed = {
  stage: ProjectStageId
  role: ProjectRoleId
  recommendedPlatform: DetectablePlatformId
}

export type PlatformDetectionResult = {
  platformId: DetectablePlatformId
  available: boolean
  command?: string
}

export type ResolveProjectPlatformResolutionInput = {
  profile: ProjectProfileId
  generatedAt?: string
  detectPlatform?: (platformId: DetectablePlatformId) => Promise<PlatformDetectionResult>
}

export const DEFAULT_STAGE_PLATFORM_SEEDS: StagePlatformSeed[] = [
  {
    stage: 'design',
    role: 'designer',
    recommendedPlatform: 'codex',
  },
  {
    stage: 'implement',
    role: 'coder',
    recommendedPlatform: 'claude_code',
  },
  {
    stage: 'verify',
    role: 'tester',
    recommendedPlatform: 'qoder',
  },
  {
    stage: 'repair',
    role: 'fixer',
    recommendedPlatform: 'trae',
  },
]

const platformCommandProbes: Record<DetectablePlatformId, Array<{ command: string; args: string[] }>> = {
  codex: [{ command: 'codex', args: ['--version'] }],
  claude_code: [
    { command: 'claude', args: ['--version'] },
    { command: 'claude-code', args: ['--version'] },
  ],
  qoder: [{ command: 'qoder', args: ['--version'] }],
  trae: [{ command: 'trae', args: ['--version'] }],
}

async function canRunCommand(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'ignore',
      shell: false,
    })

    child.once('error', () => {
      resolve(false)
    })

    child.once('close', (code) => {
      resolve(code === 0)
    })
  })
}

export async function detectPlatformAvailability(platformId: DetectablePlatformId): Promise<PlatformDetectionResult> {
  const probes = platformCommandProbes[platformId]

  for (const probe of probes) {
    if (await canRunCommand(probe.command, probe.args)) {
      return {
        platformId,
        available: true,
        command: probe.command,
      }
    }
  }

  return {
    platformId,
    available: false,
  }
}

function createManualResolution(input: {
  stage: ProjectStageId
  role: ProjectRoleId
  source: 'profile-rule' | 'fallback'
  recommended?: PlatformId
}) {
  return {
    stage: input.stage,
    role: input.role,
    platform: {
      recommended: input.recommended ?? 'manual',
      effective: 'manual' as const,
      source: input.source,
    },
  }
}

export async function resolveProjectPlatformResolution(
  input: ResolveProjectPlatformResolutionInput,
): Promise<ProjectOrchestrationConfig['platformResolution']> {
  const generatedAt = input.generatedAt ?? new Date().toISOString()

  if (input.profile === 'minimal' || input.profile === 'collaboration') {
    return {
      generatedAt,
      stages: DEFAULT_STAGE_PLATFORM_SEEDS.map((seed) =>
        createManualResolution({
          stage: seed.stage,
          role: seed.role,
          source: 'profile-rule',
        }),
      ),
    }
  }

  const detectPlatform = input.detectPlatform ?? detectPlatformAvailability
  const detectionCache = new Map<DetectablePlatformId, PlatformDetectionResult>()

  const stages = await Promise.all(
    DEFAULT_STAGE_PLATFORM_SEEDS.map(async (seed) => {
      const cached = detectionCache.get(seed.recommendedPlatform)
      const detection = cached ?? await detectPlatform(seed.recommendedPlatform)

      detectionCache.set(seed.recommendedPlatform, detection)

      if (!detection.available) {
        return createManualResolution({
          stage: seed.stage,
          role: seed.role,
          source: 'fallback',
          recommended: seed.recommendedPlatform,
        })
      }

      return {
        stage: seed.stage,
        role: seed.role,
        platform: {
          recommended: seed.recommendedPlatform,
          effective: seed.recommendedPlatform,
          source: 'auto-detect' as const,
        },
      }
    }),
  )

  return {
    generatedAt,
    stages,
  }
}
