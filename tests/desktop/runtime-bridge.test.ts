import { describe, expect, it } from 'vitest'

import { buildRuntimeBridgeRequest } from '@desktop/lib/runtime-bridge.js'

describe('desktop runtime bridge', () => {
  it('builds a desktop runtime bridge request', () => {
    expect(buildRuntimeBridgeRequest('task.list').name).toBe('task.list')
  })
})
