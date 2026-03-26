import { describe, expect, it } from 'vitest'

import { readPackageVersion } from '@/install/package-info.js'
import { runCli } from '@tests/helpers/run-cli.js'

describe('version CLI', () => {
  it('shows the current package version for the full command', async () => {
    const packageVersion = await readPackageVersion()
    const result = await runCli(['version'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('name: foxpilot')
    expect(result.stdout).toContain(`version: ${packageVersion}`)
    expect(result.stdout).toContain('binName: foxpilot')
  })

  it('shows the current package version for the short command', async () => {
    const result = await runCli(['version'], { binName: 'fp' })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('binName: fp')
  })
})
