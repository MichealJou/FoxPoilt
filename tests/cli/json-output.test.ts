import { describe, expect, it } from 'vitest'

import { toJsonOutput } from '@/cli/json-output.js'

describe('cli json output', () => {
  it('serializes runtime result for cli json mode', () => {
    expect(toJsonOutput({ ok: true })).toContain('"ok": true')
  })
})
