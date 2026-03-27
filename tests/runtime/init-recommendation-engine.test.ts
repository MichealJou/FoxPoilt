import { describe, expect, it } from 'vitest'

import { createInitRecommendation } from '@foxpilot/runtime/init/init-recommendation-engine.js'
import type { ProjectScanSignals } from '@foxpilot/runtime/init/project-scan-signals.js'

function createSignals(overrides: Partial<ProjectScanSignals> = {}): ProjectScanSignals {
  return {
    projectPath: '/workspace/foxpilot',
    repositoryCount: 1,
    structure: {
      repositoryLayout: 'single-repo',
      hasMonorepoMarkers: false,
      hasNestedRepositories: false,
      keyPaths: ['package.json'],
    },
    stack: {
      languages: ['typescript'],
      packageManagers: ['pnpm'],
      runtimeHints: ['node'],
      frameworkHints: ['react'],
    },
    workflow: {
      hasTests: true,
      hasDocsEmphasis: false,
      hasCiConfig: true,
      likelyProjectType: 'standard-software',
    },
    health: {
      missingProjectConfig: true,
      missingFoundation: false,
      missingRecommendedBindings: [],
      brokenRepositoryRefs: [],
    },
    integrations: {
      hasBeads: false,
      hasSuperpowers: false,
      hasPlatforms: [],
      hasSkills: [],
      hasMcpServers: [],
    },
    scannedAt: '2026-03-27T00:00:00.000Z',
    ...overrides,
  }
}

describe('init recommendation engine', () => {
  it('recommends collaboration for multi-repository projects', () => {
    const result = createInitRecommendation(
      createSignals({
        repositoryCount: 2,
        structure: {
          repositoryLayout: 'multi-repo',
          hasMonorepoMarkers: true,
          hasNestedRepositories: true,
          keyPaths: ['pnpm-workspace.yaml'],
        },
        workflow: {
          hasTests: true,
          hasDocsEmphasis: true,
          hasCiConfig: true,
          likelyProjectType: 'mixed',
        },
      }),
    )

    expect(result.profile.recommended).toBe('collaboration')
    expect(result.profile.reasons[0]).toContain('多仓库结构')
  })

  it('recommends minimal for docs-heavy projects', () => {
    const result = createInitRecommendation(
      createSignals({
        structure: {
          repositoryLayout: 'docs-heavy',
          hasMonorepoMarkers: false,
          hasNestedRepositories: false,
          keyPaths: ['docs/'],
        },
        stack: {
          languages: [],
          packageManagers: [],
          runtimeHints: [],
          frameworkHints: [],
        },
        workflow: {
          hasTests: false,
          hasDocsEmphasis: true,
          hasCiConfig: false,
          likelyProjectType: 'docs-heavy',
        },
      }),
    )

    expect(result.profile.recommended).toBe('minimal')
    expect(result.workflowTemplate.recommended).toBe('docs-heavy')
  })
})
