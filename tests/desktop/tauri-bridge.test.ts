import { describe, expect, it } from 'vitest'

import { getFallbackDesktopRuntimeStatus } from '@desktop/lib/tauri-status.js'

describe('desktop tauri bridge status', () => {
  it('exposes a deterministic fallback runtime status for web preview', () => {
    const status = getFallbackDesktopRuntimeStatus()

    expect(status.shell).toBe('web')
    expect(status.runtime).toBe('shared-runtime-core')
    expect(status.cliJsonReady).toBe(true)
    expect(status.pages).toContain('control-plane')
    expect(status.platformAdapters).toContain('claude_code')
  })
})
