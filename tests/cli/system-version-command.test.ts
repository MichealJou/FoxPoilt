import { describe, expect, it } from 'vitest'

import { readPackageVersion } from '@infra/install/package-info.js'
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

  it('returns structured json version metadata when called with --json', async () => {
    const packageVersion = await readPackageVersion()
    const result = await runCli(['version', '--json'], { binName: 'fp' })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        name: string
        version: string
        binName: string
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('version')
    expect(payload.data.name).toBe('foxpilot')
    expect(payload.data.version).toBe(packageVersion)
    expect(payload.data.binName).toBe('fp')
  })
})
