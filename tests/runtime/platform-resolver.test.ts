import { describe, expect, it } from 'vitest'

import { resolveProjectPlatformResolution } from '@/runtime/orchestrators/platform-resolver.js'

describe('platform resolver', () => {
  it('falls back to manual when the recommended platform is missing', async () => {
    const result = await resolveProjectPlatformResolution({
      profile: 'default',
      generatedAt: '2026-03-27T00:00:00.000Z',
      detectPlatform: async (platformId) => ({
        platformId,
        available: platformId === 'codex',
      }),
    })

    expect(result.stages).toEqual([
      {
        stage: 'design',
        role: 'designer',
        platform: {
          recommended: 'codex',
          effective: 'codex',
          source: 'auto-detect',
        },
      },
      {
        stage: 'implement',
        role: 'coder',
        platform: {
          recommended: 'claude_code',
          effective: 'manual',
          source: 'fallback',
        },
      },
      {
        stage: 'verify',
        role: 'tester',
        platform: {
          recommended: 'qoder',
          effective: 'manual',
          source: 'fallback',
        },
      },
      {
        stage: 'repair',
        role: 'fixer',
        platform: {
          recommended: 'trae',
          effective: 'manual',
          source: 'fallback',
        },
      },
    ])
  })

  it('keeps collaboration profile on manual platform mode', async () => {
    const result = await resolveProjectPlatformResolution({
      profile: 'collaboration',
      generatedAt: '2026-03-27T00:00:00.000Z',
    })

    expect(result.stages.every((stage) => stage.platform.effective === 'manual')).toBe(true)
    expect(result.stages.every((stage) => stage.platform.source === 'profile-rule')).toBe(true)
  })
})
