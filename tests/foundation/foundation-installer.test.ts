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

  it('installs missing tools through the official installer and re-checks readiness', async () => {
    const { setupFoundationPack } = await import('@/foundation/foundation-installer.js')

    const installedTools: string[] = []

    const result = await setupFoundationPack({
      detectTool: async (tool) => {
        if (tool === 'beads' && installedTools.includes('beads')) {
          return { version: '2.0.0' }
        }

        if (tool === 'superpowers') {
          return { version: null }
        }

        return null
      },
      installOfficialTool: async (tool) => {
        installedTools.push(tool)
      },
    })

    expect(installedTools).toEqual(['beads'])
    expect(result.installed).toEqual(['beads'])
    expect(result.missing).toEqual([])
    expect(result.ready).toEqual(['beads', 'superpowers'])
  })
})
