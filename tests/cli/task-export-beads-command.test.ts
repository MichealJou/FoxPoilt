import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

async function createManagedProject(input?: {
  homeDir?: string
  repositories?: string[]
}): Promise<{
  homeDir: string
  projectRoot: string
}> {
  const homeDir = input?.homeDir ?? await createTempDir('foxpilot-home-')
  const projectRoot = await createTempDir('foxpilot-project-')

  if (!input?.homeDir) {
    tempDirs.push(homeDir)
  }

  tempDirs.push(projectRoot)

  const repositories = input?.repositories ?? ['.']
  await Promise.all(repositories.map(async (repositoryPath) => {
    const repositoryRoot = repositoryPath === '.'
      ? projectRoot
      : path.join(projectRoot, repositoryPath)
    await mkdir(path.join(repositoryRoot, '.git'), { recursive: true })
  }))

  const initResult = await runCli(
    ['init', '--path', projectRoot, '--workspace-root', path.dirname(projectRoot), '--mode', 'non-interactive'],
    { homeDir },
  )
  expect(initResult.exitCode).toBe(0)

  return {
    homeDir,
    projectRoot,
  }
}

async function importBeadsSnapshot(input: {
  homeDir: string
  projectRoot: string
  fileName: string
  records: unknown
}): Promise<void> {
  const snapshotPath = path.join(input.projectRoot, input.fileName)
  await writeFile(snapshotPath, `${JSON.stringify(input.records, null, 2)}\n`, 'utf8')

  const importResult = await runCli(
    ['task', 'import-beads', '--file', snapshotPath],
    { cwd: input.projectRoot, homeDir: input.homeDir },
  )
  expect(importResult.exitCode).toBe(0)
}

describe('task export-beads CLI', () => {
  it('exports imported beads tasks into an import-compatible json snapshot', async () => {
    const { homeDir, projectRoot } = await createManagedProject({
      repositories: ['.', 'frontend'],
    })

    await importBeadsSnapshot({
      homeDir,
      projectRoot,
      fileName: 'beads-source.json',
      records: [
        {
          externalTaskId: 'BEADS-3001',
          title: '主仓待办',
          status: 'ready',
          priority: 'P1',
          repository: '.',
        },
        {
          externalTaskId: 'BEADS-3002',
          title: '前端处理中',
          status: 'doing',
          priority: 'P2',
          repository: 'frontend',
        },
        {
          externalTaskId: 'BEADS-3003',
          title: '等待 unblock',
          status: 'blocked',
          priority: 'P0',
          repository: '.',
        },
      ],
    })

    const manualTaskResult = await runCli(
      [
        'task',
        'create',
        '--path',
        projectRoot,
        '--title',
        '这是手动任务，不应出现在导出快照里',
      ],
      { cwd: projectRoot, homeDir },
    )
    expect(manualTaskResult.exitCode).toBe(0)

    const exportPath = path.join(projectRoot, 'out', 'beads-export.json')
    const result = await runCli(
      ['task', 'export-beads', '--file', exportPath],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已完成 Beads 任务导出')
    expect(result.stdout).toContain('- exported: 3')
    expect(result.stdout).toContain(`- file: ${exportPath}`)

    const exported = JSON.parse(await readFile(exportPath, 'utf8')) as Array<{
      externalTaskId: string
      title: string
      status: string
      priority: string
      repository: string
    }>

    expect(exported).toEqual([
      {
        externalTaskId: 'BEADS-3001',
        title: '主仓待办',
        status: 'ready',
        priority: 'P1',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-3002',
        title: '前端处理中',
        status: 'doing',
        priority: 'P2',
        repository: 'frontend',
      },
      {
        externalTaskId: 'BEADS-3003',
        title: '等待 unblock',
        status: 'blocked',
        priority: 'P0',
        repository: '.',
      },
    ])
  })

  it('exports an empty array when the project has no imported beads tasks', async () => {
    const { homeDir, projectRoot } = await createManagedProject()
    const exportPath = path.join(projectRoot, 'empty-beads.json')

    const result = await runCli(
      ['task', 'export-beads', '--file', exportPath],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- exported: 0')

    const exported = JSON.parse(await readFile(exportPath, 'utf8')) as unknown[]
    expect(exported).toEqual([])
  })

  it('uses the selected project path to avoid cross-project export leakage', async () => {
    const sharedHomeDir = await createTempDir('foxpilot-home-')
    tempDirs.push(sharedHomeDir)

    const firstProject = await createManagedProject({
      homeDir: sharedHomeDir,
      repositories: ['.', 'frontend'],
    })
    const secondProject = await createManagedProject({
      homeDir: sharedHomeDir,
      repositories: ['.', 'api'],
    })

    await importBeadsSnapshot({
      homeDir: sharedHomeDir,
      projectRoot: firstProject.projectRoot,
      fileName: 'first-beads.json',
      records: [
        {
          externalTaskId: 'BEADS-FIRST-1',
          title: '只属于第一个项目',
          status: 'ready',
          priority: 'P1',
          repository: 'frontend',
        },
      ],
    })

    await importBeadsSnapshot({
      homeDir: sharedHomeDir,
      projectRoot: secondProject.projectRoot,
      fileName: 'second-beads.json',
      records: [
        {
          externalTaskId: 'BEADS-SECOND-1',
          title: '只属于第二个项目',
          status: 'doing',
          priority: 'P2',
          repository: 'api',
        },
      ],
    })

    const exportPath = path.join(secondProject.projectRoot, 'scoped-export.json')
    const result = await runCli(
      ['task', 'export-beads', '--path', secondProject.projectRoot, '--file', exportPath],
      { cwd: firstProject.projectRoot, homeDir: sharedHomeDir },
    )

    expect(result.exitCode).toBe(0)

    const exported = JSON.parse(await readFile(exportPath, 'utf8')) as Array<{
      externalTaskId: string
      title: string
      status: string
      priority: string
      repository: string
    }>

    expect(exported).toEqual([
      {
        externalTaskId: 'BEADS-SECOND-1',
        title: '只属于第二个项目',
        status: 'doing',
        priority: 'P2',
        repository: 'api',
      },
    ])
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'export-beads', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task export-beads')
    expect(result.stdout).toContain('fp task export-beads')
  })

  it('returns a clear error when file is missing', async () => {
    const { homeDir, projectRoot } = await createManagedProject()

    const result = await runCli(
      ['task', 'export-beads'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('file 不能为空')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot } = await createManagedProject()

    const result = await runCli(
      ['task', 'export-beads', '--file', path.join(projectRoot, 'beads.json')],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
