/**
 * @file src/commands/init/init-profile.ts
 * @author michaeljou
 */

import type { ProjectProfileId } from '@contracts/orchestration-contract.js'

/**
 * 当前阶段可选的项目协作 profile。
 *
 * 第一批先固定三档，后续扩展时只需要追加条目即可。
 */
export const PROJECT_PROFILES = [
  {
    id: 'default',
    label: '默认组合',
    summary: '启用默认本地协作编排能力。',
  },
  {
    id: 'collaboration',
    label: '协作组合',
    summary: '保留协作接入，但不自动分配执行平台。',
  },
  {
    id: 'minimal',
    label: '轻量组合',
    summary: '仅接管项目，不启用自动执行平台。',
  },
] as const satisfies ReadonlyArray<{
  id: ProjectProfileId
  label: string
  summary: string
}>

export function isProjectProfileId(value: string | undefined): value is ProjectProfileId {
  return value === 'default' || value === 'collaboration' || value === 'minimal'
}

export function resolveProjectProfileId(value: ProjectProfileId | undefined): ProjectProfileId {
  return value ?? 'default'
}
