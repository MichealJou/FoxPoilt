/**
 * @file src/contracts/orchestration-contract.ts
 * @author michaeljou
 */

/**
 * 第二阶段项目级协作 profile。
 *
 * 这里只定义稳定 ID，不在合同层承载展示文案。
 */
export type ProjectProfileId = 'default' | 'collaboration' | 'minimal'

/**
 * 第二阶段第一批固定阶段集合。
 */
export type ProjectStageId = 'design' | 'implement' | 'verify' | 'repair'

/**
 * 第二阶段第一批固定角色集合。
 */
export type ProjectRoleId = 'designer' | 'coder' | 'tester' | 'fixer'

/**
 * 当前支持的平台集合。
 *
 * `manual` 表示没有自动分配到具体平台，保留给人工接管。
 */
export type PlatformId = 'codex' | 'claude_code' | 'qoder' | 'trae' | 'manual'

export type DetectablePlatformId = Exclude<PlatformId, 'manual'>

/**
 * 平台生效来源。
 */
export type PlatformResolutionSource = 'profile-rule' | 'auto-detect' | 'fallback'

/**
 * 每个阶段最终落进 project.json 的最小平台解析结果。
 */
export type ProjectStagePlatformResolution = {
  stage: ProjectStageId
  role: ProjectRoleId
  platform: {
    recommended: PlatformId
    effective: PlatformId
    source: PlatformResolutionSource
  }
}

/**
 * 第二阶段最小 orchestration 配置块。
 */
export type ProjectOrchestrationConfig = {
  profile: {
    selected: ProjectProfileId
  }
  platformResolution: {
    generatedAt: string
    stages: ProjectStagePlatformResolution[]
  }
}
