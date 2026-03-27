import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

async function expectExists(targetPath: string): Promise<void> {
  await expect(access(targetPath)).resolves.toBeUndefined()
}

async function expectMissing(targetPath: string): Promise<void> {
  await expect(access(targetPath)).rejects.toBeDefined()
}

async function createProjectFixture(prefix: string): Promise<string> {
  const projectRoot = await createTempDir(prefix)
  tempDirs.push(projectRoot)
  await mkdir(path.join(projectRoot, '.git'), { recursive: true })
  await mkdir(path.join(projectRoot, 'frontend', '.git'), { recursive: true })
  return projectRoot
}

describe('foxpilot init CLI', () => {
  it('prints usage when called with --help', async () => {
    const result = await runCli(['init', '--help'])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot init')
  })

  it('accepts the fp alias', async () => {
    const result = await runCli(['init', '--help'], { binName: 'fp' })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot init')
  })

  it('localizes init help output after language is switched', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    tempDirs.push(homeDir)

    const setLanguage = await runCli(
      ['config', 'set-language', '--lang', 'en-US'],
      { homeDir },
    )
    expect(setLanguage.exitCode).toBe(0)

    const result = await runCli(
      ['init', '--help'],
      { homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Initialize a managed project')
  })

  it('initializes a project in non-interactive mode', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(
      [
        'init',
        '--path',
        projectRoot,
        '--name',
        'foxpilot',
        '--workspace-root',
        path.dirname(projectRoot),
        '--mode',
        'non-interactive',
        '--no-scan',
      ],
      { homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 初始化完成')
    expect(result.stdout).toContain('[FoxPilot] 已写入项目索引')
    expect(result.stdout).toContain('- profile: default')
    await expectExists(path.join(projectRoot, '.foxpilot', 'project.json'))
    await expectExists(path.join(homeDir, '.foxpilot', 'foxpilot.config.json'))
    await expectExists(path.join(homeDir, '.foxpilot', 'foxpilot.db'))

    const rawProjectConfig = await readFile(
      path.join(projectRoot, '.foxpilot', 'project.json'),
      'utf8',
    )
    expect(rawProjectConfig).toContain('"version": 2')
    expect(rawProjectConfig).toContain('"selected": "default"')
  })

  it('initializes a project through the fp alias', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(
      [
        'init',
        '--path',
        projectRoot,
        '--workspace-root',
        path.dirname(projectRoot),
        '--mode',
        'non-interactive',
      ],
      { binName: 'fp', homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 初始化完成')
  })

  it('writes the selected init profile into project config', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(
      [
        'init',
        '--path',
        projectRoot,
        '--workspace-root',
        path.dirname(projectRoot),
        '--profile',
        'collaboration',
        '--mode',
        'non-interactive',
        '--no-scan',
      ],
      { homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- profile: collaboration')

    const rawProjectConfig = await readFile(
      path.join(projectRoot, '.foxpilot', 'project.json'),
      'utf8',
    )
    expect(rawProjectConfig).toContain('"selected": "collaboration"')
    expect(rawProjectConfig).toContain('"recommended": "manual"')
    expect(rawProjectConfig).toContain('"source": "profile-rule"')
  })

  it('auto-selects collaboration profile for multi-repository projects', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(
      [
        'init',
        '--path',
        projectRoot,
        '--workspace-root',
        path.dirname(projectRoot),
        '--mode',
        'non-interactive',
      ],
      { homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- profile: collaboration')
    expect(result.stdout).toContain('- recommendedProfile: collaboration')
  })

  it('asks for interface language on first interactive init and persists the selection', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(['init'], {
      cwd: projectRoot,
      homeDir,
      stdin: ['2', 'y', 'y', 'y', 'y', 'y'],
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Select interface language')
    expect(result.stdout).toContain('[FoxPilot] Initialization completed')

    const rawConfig = await readFile(
      path.join(homeDir, '.foxpilot', 'foxpilot.config.json'),
      'utf8',
    )
    expect(rawConfig).toContain('"interfaceLanguage": "en-US"')
  })

  it('reuses the stored interface language on later init runs without prompting again', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const firstProjectRoot = await createProjectFixture('foxpilot-project-')
    const secondProjectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const firstResult = await runCli(['init'], {
      cwd: firstProjectRoot,
      homeDir,
      stdin: ['2', 'y', 'y', 'y', 'y', 'y'],
    })
    expect(firstResult.exitCode).toBe(0)

    const secondResult = await runCli(['init'], {
      cwd: secondProjectRoot,
      homeDir,
      stdin: ['y', 'y', 'y', 'y', 'y'],
    })

    expect(secondResult.exitCode).toBe(0)
    expect(secondResult.stdout).not.toContain('Select interface language')
    expect(secondResult.stdout).toContain('[FoxPilot] Initialization completed')
  })

  it('does not leave partial init artifacts when sqlite bootstrap fails', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(
      [
        'init',
        '--path',
        projectRoot,
        '--workspace-root',
        path.dirname(projectRoot),
        '--mode',
        'non-interactive',
      ],
      { homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
    await expectMissing(path.join(projectRoot, '.foxpilot', 'project.json'))
    await expectMissing(path.join(homeDir, '.foxpilot', 'foxpilot.config.json'))
  })

  it('restores global config when index upsert fails after config merge', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)
    const globalDir = path.join(homeDir, '.foxpilot')
    const globalConfigPath = path.join(globalDir, 'foxpilot.config.json')
    const originalConfig = '{\n  "workspaceRoots": [\n    "/tmp/existing"\n  ],\n  "defaultProjectMode": "workspace_root",\n  "defaultTaskView": "table",\n  "defaultExecutor": "codex"\n}\n'

    await mkdir(globalDir, { recursive: true })
    await writeFile(globalConfigPath, originalConfig, 'utf8')

    const result = await runCli(
      [
        'init',
        '--path',
        projectRoot,
        '--workspace-root',
        path.dirname(projectRoot),
        '--mode',
        'non-interactive',
      ],
      { homeDir, failUpsert: true },
    )

    expect(result.exitCode).toBe(1)
    expect(await readFile(globalConfigPath, 'utf8')).toBe(originalConfig)
    await expectMissing(path.join(projectRoot, '.foxpilot', 'project.json'))
  })

  it('does not leave dirty db state when project config write fails', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(
      [
        'init',
        '--path',
        projectRoot,
        '--workspace-root',
        path.dirname(projectRoot),
        '--mode',
        'non-interactive',
      ],
      { homeDir, failWriteProjectConfig: true },
    )

    expect(result.exitCode).toBe(1)
    await expectMissing(path.join(projectRoot, '.foxpilot', 'project.json'))

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const workspaceRootCount = db.prepare('SELECT COUNT(*) AS count FROM workspace_root').get() as { count: number }
    const projectCount = db.prepare('SELECT COUNT(*) AS count FROM project').get() as { count: number }
    const repositoryCount = db.prepare('SELECT COUNT(*) AS count FROM repository').get() as { count: number }

    expect(workspaceRootCount.count).toBe(0)
    expect(projectCount.count).toBe(0)
    expect(repositoryCount.count).toBe(0)

    db.close()
  })

  it('defaults to interactive mode when --mode is omitted', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(['init'], {
      cwd: projectRoot,
      homeDir,
      stdin: ['y', 'y', 'y', 'y', 'y'],
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('是否使用这个目录初始化')
    expect(result.stdout).toContain('[FoxPilot] 初始化完成')
  })

  it('returns exit code 1 when target path does not exist', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    tempDirs.push(homeDir)
    const projectRoot = path.join(homeDir, 'missing-project')

    const result = await runCli(
      ['init', '--path', projectRoot, '--mode', 'non-interactive'],
      { homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('目标路径不存在')
  })

  it('returns exit code 1 when target path is not a directory', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    tempDirs.push(homeDir)
    const filePath = path.join(homeDir, 'project.txt')

    await writeFile(filePath, 'hello', 'utf8')

    const result = await runCli(
      ['init', '--path', filePath, '--mode', 'non-interactive'],
      { homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('目标路径不是目录')
  })

  it('returns exit code 1 when workspace root does not contain project root', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(
      [
        'init',
        '--path',
        projectRoot,
        '--workspace-root',
        '/tmp/not-parent',
        '--mode',
        'non-interactive',
      ],
      { homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('workspace root 不包含项目路径')
  })

  it('returns exit code 3 when global config is malformed', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    await mkdir(path.join(homeDir, '.foxpilot'), { recursive: true })
    await writeFile(path.join(homeDir, '.foxpilot', 'foxpilot.config.json'), '{bad json', 'utf8')

    const result = await runCli(
      ['init', '--path', projectRoot, '--mode', 'non-interactive'],
      { homeDir },
    )

    expect(result.exitCode).toBe(3)
    expect(result.stdout).toContain('foxpilot.config.json 格式错误')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const result = await runCli(
      ['init', '--path', projectRoot, '--mode', 'non-interactive'],
      { homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })

  it('returns exit code 2 when project has already been initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createProjectFixture('foxpilot-project-')
    tempDirs.push(homeDir)

    const first = await runCli(
      ['init', '--path', projectRoot, '--mode', 'non-interactive'],
      { homeDir },
    )
    expect(first.exitCode).toBe(0)

    const second = await runCli(
      ['init', '--path', projectRoot, '--mode', 'non-interactive'],
      { homeDir },
    )

    expect(second.exitCode).toBe(2)
    expect(second.stdout).toContain('项目已存在配置')
    await expect(stat(path.join(projectRoot, '.foxpilot', 'project.json'))).resolves.toBeDefined()
  })
})
