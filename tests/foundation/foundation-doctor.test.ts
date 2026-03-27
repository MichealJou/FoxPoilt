import { describe, expect, it } from 'vitest'

describe('foundation doctor', () => {
  it('reports doctor result for missing and ready tools', async () => {
    const { runFoundationDoctor } = await import('@integrations/foundation/foundation-doctor.js')

    const result = await runFoundationDoctor({
      detectTool: async (tool) =>
        tool === 'beads'
          ? null
          : {
              version: '1.0.0',
            },
    })

    expect(result.packId).toBe('default-foundation')
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        tool: 'beads',
        status: 'missing',
      }),
    )
    expect(result.items[1]).toEqual(
      expect.objectContaining({
        tool: 'superpowers',
        status: 'ready',
        version: '1.0.0',
      }),
    )
  })
})
