import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

describe('config set-language CLI', () => {
  it('writes the selected interface language into global config', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    tempDirs.push(homeDir)

    const result = await runCli(
      ['config', 'set-language', '--lang', 'en-US'],
      { homeDir },
    )

    expect(result.exitCode).toBe(0)

    const rawConfig = await readFile(
      path.join(homeDir, '.foxpilot', 'foxpilot.config.json'),
      'utf8',
    )

    expect(rawConfig).toContain('"interfaceLanguage": "en-US"')
  })

  it('uses the stored interface language for later command output', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    await mkdir(path.join(projectRoot, '.git'), { recursive: true })

    const setLanguage = await runCli(
      ['config', 'set-language', '--lang', 'en-US'],
      { homeDir },
    )
    expect(setLanguage.exitCode).toBe(0)

    const result = await runCli(
      ['task', 'list'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('Project is not initialized')
  })
})
