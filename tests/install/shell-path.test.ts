import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('shell path helper', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const targetPath = tempDirs.pop()
      if (targetPath) {
        await removeTempDir(targetPath)
      }
    }
  })

  it('writes foxpilot bin path into the detected zsh profile', async () => {
    const { ensureUnixShellPath } = await import('@foxpilot/infra/install/shell-path.js')
    const homeDir = await createTempDir('foxpilot-shell-home-')
    const binDir = path.join(homeDir, '.foxpilot/bin')
    tempDirs.push(homeDir)

    const firstResult = await ensureUnixShellPath({
      homeDir,
      shellPath: '/bin/zsh',
      binDir,
    })

    const profilePath = path.join(homeDir, '.zshrc')
    const profileContent = await readFile(profilePath, 'utf8')

    expect(firstResult).toEqual({
      shellName: 'zsh',
      profilePath,
      updated: true,
    })
    expect(profileContent).toContain('# >>> FoxPilot PATH >>>')
    expect(profileContent).toContain('export PATH="$HOME/.foxpilot/bin:$PATH"')

    const secondResult = await ensureUnixShellPath({
      homeDir,
      shellPath: '/bin/zsh',
      binDir,
    })
    const nextProfileContent = await readFile(profilePath, 'utf8')

    expect(secondResult).toEqual({
      shellName: 'zsh',
      profilePath,
      updated: false,
    })
    expect(nextProfileContent.match(/# >>> FoxPilot PATH >>>/g)?.length ?? 0).toBe(1)
  })

  it('falls back to profile when shell cannot be recognized', async () => {
    const { ensureUnixShellPath } = await import('@foxpilot/infra/install/shell-path.js')
    const homeDir = await createTempDir('foxpilot-shell-home-')
    tempDirs.push(homeDir)

    const result = await ensureUnixShellPath({
      homeDir,
      shellPath: '/bin/unknown-shell',
      binDir: path.join(homeDir, '.foxpilot/bin'),
    })

    expect(result.shellName).toBe('sh')
    expect(result.profilePath).toBe(path.join(homeDir, '.profile'))
  })

  it('removes the managed foxpilot path block from shell profiles', async () => {
    const { ensureUnixShellPath, removeUnixShellPath } =
      await import('@foxpilot/infra/install/shell-path.js')
    const homeDir = await createTempDir('foxpilot-shell-home-')
    const binDir = path.join(homeDir, '.foxpilot/bin')
    tempDirs.push(homeDir)

    await ensureUnixShellPath({
      homeDir,
      shellPath: '/bin/zsh',
      binDir,
    })

    const result = await removeUnixShellPath({
      homeDir,
      binDir,
    })

    const profilePath = path.join(homeDir, '.zshrc')
    const profileContent = await readFile(profilePath, 'utf8')

    expect(result.updatedProfiles).toEqual([profilePath])
    expect(profileContent).not.toContain('FoxPilot PATH')
    expect(profileContent).not.toContain('export PATH="$HOME/.foxpilot/bin:$PATH"')
  })
})
