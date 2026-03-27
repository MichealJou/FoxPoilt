import { describe, expect, it } from 'vitest'

describe('foundation installer', () => {
  it('returns the default foundation pack with beads and superpowers', async () => {
    const { getDefaultFoundationPack } = await import('@/foundation/foundation-profile.js')

    expect(getDefaultFoundationPack().items).toEqual(['beads', 'superpowers'])
  })

  it('marks missing tools as installable units', async () => {
    const { ensureFoundationPack } = await import('@/foundation/foundation-installer.js')

    const result = await ensureFoundationPack({
      detectTool: async (tool) =>
        tool === 'beads'
          ? null
          : {
              version: '1.0.0',
            },
    })

    expect(result.packId).toBe('default-foundation')
    expect(result.missing).toContain('beads')
    expect(result.ready).toContain('superpowers')
    expect(result.items).toEqual([
      expect.objectContaining({
        tool: 'beads',
        status: 'missing',
      }),
      expect.objectContaining({
        tool: 'superpowers',
        status: 'ready',
        version: '1.0.0',
      }),
    ])
  })
})
