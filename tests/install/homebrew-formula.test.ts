import { describe, expect, it } from 'vitest'

import { renderHomebrewFormula } from '@foxpilot/infra/install/homebrew-formula.js'

describe('homebrew formula renderer', () => {
  it('renders a stable formula with versioned release urls', () => {
    const formula = renderHomebrewFormula({
      version: '0.1.0',
      repository: 'MichealJou/FoxPoilt',
      darwinArm64Sha256: 'aaa',
      darwinX64Sha256: 'bbb',
      linuxX64Sha256: 'ccc',
    })

    expect(formula).toContain('class Foxpilot < Formula')
    expect(formula).toContain('version "0.1.0"')
    expect(formula).toContain(
      'https://github.com/MichealJou/FoxPoilt/releases/download/v0.1.0/foxpilot-darwin-arm64.tar.gz',
    )
    expect(formula).toContain('sha256 "aaa"')
    expect(formula).toContain('sha256 "bbb"')
    expect(formula).toContain('sha256 "ccc"')
  })
})
