import { describe, expect, it } from 'vitest'

import { createRuntimeCommand } from '@/contracts/runtime-contract.js'

describe('shared runtime contract', () => {
  it('defines a shared runtime command contract', () => {
    expect(createRuntimeCommand('task.list').name).toBe('task.list')
  })
})
