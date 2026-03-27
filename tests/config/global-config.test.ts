import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

type EnsureGlobalConfig = (input: { homeDir: string; workspaceRoot?: string }) => Promise<{
  configPath: string
  config: {
    workspaceRoots: string[]
    defaultProjectMode: string
    defaultTaskView: string
    defaultExecutor: string
    interfaceLanguage: 'zh-CN' | 'en-US' | 'ja-JP'
  }
}>

type ErrorClass = new (...args: any[]) => Error

type FindMatchingWorkspaceRoot = (projectRoot: string, workspaceRoots: string[]) => string | null

async function loadGlobalConfigModule(): Promise<{
  ensureGlobalConfig: EnsureGlobalConfig
  findMatchingWorkspaceRoot: FindMatchingWorkspaceRoot
  GlobalConfigParseError: ErrorClass
}> {
  try {
    return await import('@foxpilot/infra/config/global-config.js')
  } catch {
    return {
      ensureGlobalConfig: async () => ({
        configPath: '',
        config: {
          workspaceRoots: [],
          defaultProjectMode: '',
          defaultTaskView: '',
          defaultExecutor: '',
          interfaceLanguage: 'zh-CN',
        },
      }),
      findMatchingWorkspaceRoot: () => null,
      GlobalConfigParseError: Error as ErrorClass,
    }
  }
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

describe('global config', () => {
  it('creates default global config under ~/.foxpilot', async () => {
    const tempHome = await createTempDir('foxpilot-home-')
    tempDirs.push(tempHome)
    const { ensureGlobalConfig } = await loadGlobalConfigModule()

    const result = await ensureGlobalConfig({ homeDir: tempHome })

    expect(result.configPath).toBe(`${tempHome}/.foxpilot/foxpilot.config.json`)
    expect(result.config.defaultExecutor).toBe('codex')
    expect(result.config.interfaceLanguage).toBe('zh-CN')
  })

  it('merges workspace roots without overwriting existing defaults', async () => {
    const tempHome = await createTempDir('foxpilot-home-')
    tempDirs.push(tempHome)
    const { ensureGlobalConfig } = await loadGlobalConfigModule()

    await ensureGlobalConfig({ homeDir: tempHome, workspaceRoot: '/Users/program/code' })
    const result = await ensureGlobalConfig({ homeDir: tempHome, workspaceRoot: '/Users/program/demo' })

    expect(result.config.workspaceRoots).toEqual([
      '/Users/program/code',
      '/Users/program/demo',
    ])
    expect(result.config.defaultExecutor).toBe('codex')
  })

  it('updates the stored interface language without losing workspace roots', async () => {
    const tempHome = await createTempDir('foxpilot-home-')
    tempDirs.push(tempHome)
    const { ensureGlobalConfig } = await loadGlobalConfigModule()

    await ensureGlobalConfig({ homeDir: tempHome, workspaceRoot: '/Users/program/code' })
    const result = await ensureGlobalConfig({
      homeDir: tempHome,
      workspaceRoot: '/Users/program/code',
      interfaceLanguage: 'en-US',
    } as Parameters<EnsureGlobalConfig>[0])

    expect(result.config.workspaceRoots).toEqual(['/Users/program/code'])
    expect(result.config.interfaceLanguage).toBe('en-US')
  })

  it('throws a typed error when global config json is malformed', async () => {
    const tempHome = await createTempDir('foxpilot-home-')
    tempDirs.push(tempHome)
    const { mkdir, writeFile } = await import('node:fs/promises')
    const { ensureGlobalConfig, GlobalConfigParseError } = await loadGlobalConfigModule()

    await mkdir(`${tempHome}/.foxpilot`, { recursive: true })
    await writeFile(`${tempHome}/.foxpilot/foxpilot.config.json`, '{bad json')

    await expect(ensureGlobalConfig({ homeDir: tempHome })).rejects.toBeInstanceOf(GlobalConfigParseError)
  })

  it('prefers the longest matching workspace root from existing config', async () => {
    const { findMatchingWorkspaceRoot } = await loadGlobalConfigModule()

    expect(
      findMatchingWorkspaceRoot('/Users/program/code/foxpilot-workspace', [
        '/Users/program',
        '/Users/program/code',
      ]),
    ).toBe('/Users/program/code')
  })
})
