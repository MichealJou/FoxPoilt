/**
 * @file src/runtime/init/init-recommendation-engine.ts
 * @author michaeljou
 */

import type { DetectablePlatformId, ProjectProfileId, ProjectRoleId, ProjectStageId } from '@/contracts/orchestration-contract.js'
import { DEFAULT_STAGE_PLATFORM_SEEDS } from '@/runtime/orchestrators/platform-resolver.js'
import type { ProjectScanSignals } from '@/runtime/init/project-scan-signals.js'

export type InitRecommendationResult = {
  profile: {
    recommended: ProjectProfileId
    reasons: string[]
    alternatives: ProjectProfileId[]
  }
  workflowTemplate: {
    recommended: 'standard-software' | 'fast-bugfix' | 'docs-heavy'
    reasons: string[]
    alternatives: Array<'standard-software' | 'fast-bugfix' | 'docs-heavy'>
  }
  stagePlan: Array<{
    stage: ProjectStageId
    role: ProjectRoleId
    recommendedPlatform: DetectablePlatformId
  }>
  bindings: string[]
  blockers: string[]
  warnings: string[]
}

function recommendProfile(signals: ProjectScanSignals): InitRecommendationResult['profile'] {
  if (signals.structure.repositoryLayout === 'docs-heavy') {
    return {
      recommended: 'minimal',
      reasons: ['当前项目以文档目录为主，先以轻量接管为宜。'],
      alternatives: ['collaboration', 'default'],
    }
  }

  if (signals.repositoryCount > 1 || signals.structure.hasNestedRepositories) {
    return {
      recommended: 'collaboration',
      reasons: ['检测到多仓库结构，先以协作模式接管更稳。'],
      alternatives: ['default', 'minimal'],
    }
  }

  return {
    recommended: 'default',
    reasons: ['检测到标准软件项目结构，适合直接启用默认协作组合。'],
    alternatives: ['collaboration', 'minimal'],
  }
}

function recommendWorkflowTemplate(signals: ProjectScanSignals): InitRecommendationResult['workflowTemplate'] {
  if (signals.workflow.likelyProjectType === 'docs-heavy') {
    return {
      recommended: 'docs-heavy',
      reasons: ['docs 目录信号占优，优先走文档型模板。'],
      alternatives: ['standard-software', 'fast-bugfix'],
    }
  }

  if (!signals.workflow.hasTests) {
    return {
      recommended: 'fast-bugfix',
      reasons: ['当前没有稳定测试信号，先按轻量变更模板接入。'],
      alternatives: ['standard-software', 'docs-heavy'],
    }
  }

  return {
    recommended: 'standard-software',
    reasons: ['检测到测试与工程目录，适合标准软件模板。'],
    alternatives: ['fast-bugfix', 'docs-heavy'],
  }
}

export function createInitRecommendation(signals: ProjectScanSignals): InitRecommendationResult {
  return {
    profile: recommendProfile(signals),
    workflowTemplate: recommendWorkflowTemplate(signals),
    stagePlan: DEFAULT_STAGE_PLATFORM_SEEDS.map((seed) => ({
      stage: seed.stage,
      role: seed.role,
      recommendedPlatform: seed.recommendedPlatform,
    })),
    bindings: [],
    blockers: [],
    warnings: [],
  }
}
