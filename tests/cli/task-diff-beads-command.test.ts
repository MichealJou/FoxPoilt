import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

async function createManagedProjectWithRepositories(homeDir?: string): Promise<{
  homeDir: string
  projectRoot: string
}> {
  const resolvedHomeDir = homeDir ?? await createTempDir('foxpilot-home-')
  const projectRoot = await createTempDir('foxpilot-project-')

  if (!homeDir) {
    tempDirs.push(resolvedHomeDir)
  }

  tempDirs.push(projectRoot)

  await mkdir(path.join(projectRoot, '.git'), { recursive: true })
  await mkdir(path.join(projectRoot, 'frontend', '.git'), { recursive: true })

  const initResult = await runCli(
    ['init', '--path', projectRoot, '--workspace-root', path.dirname(projectRoot), '--mode', 'non-interactive'],
    { homeDir: resolvedHomeDir },
  )
  expect(initResult.exitCode).toBe(0)

  return {
    homeDir: resolvedHomeDir,
    projectRoot,
  }
}

async function writeSnapshotFile(
  projectRoot: string,
  fileName: string,
  records: unknown,
): Promise<string> {
  const filePath = path.join(projectRoot, fileName)
  await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, 'utf8')
  return filePath
}

describe('task diff-beads CLI', () => {
  it('shows create, update and skip preview without writing to the database', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const initialSnapshotPath = await writeSnapshotFile(projectRoot, 'beads-initial.json', [
      {
        externalTaskId: 'BEADS-9001',
        title: '保持不变',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-9002',
        title: '旧标题',
        status: 'doing',
        priority: 'P1',
        repository: 'frontend',
      },
    ])

    expect((await runCli(
      ['task', 'import-beads', '--file', initialSnapshotPath],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)

    const previewSnapshotPath = await writeSnapshotFile(projectRoot, 'beads-preview.json', [
      {
        externalTaskId: 'BEADS-9001',
        title: '保持不变',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-9002',
        title: '新标题',
        status: 'done',
        priority: 'P0',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-9003',
        title: '新增任务',
        status: 'doing',
        priority: 'P3',
        repository: 'frontend',
      },
    ])

    const result = await runCli(
      ['task', 'diff-beads', '--file', previewSnapshotPath],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] Beads 快照差异预览')
    expect(result.stdout).toContain('- created: 1')
    expect(result.stdout).toContain('- updated: 1')
    expect(result.stdout).toContain('- skipped: 1')
    expect(result.stdout).toContain('- closed: 0')
    expect(result.stdout).toContain('- rejected: 0')
    expect(result.stdout).toContain('[create] BEADS-9003')
    expect(result.stdout).toContain('[update] BEADS-9002')
    expect(result.stdout).toContain('差异: title,status,priority,repository')
    expect(result.stdout).toContain('[skip] BEADS-9001')

    const listResult = await runCli(
      ['task', 'list', '--source', 'beads_sync'],
      { cwd: projectRoot, homeDir },
    )
    expect(listResult.exitCode).toBe(0)
    expect(listResult.stdout).not.toContain('新增任务')
    expect(listResult.stdout).toContain('旧标题')
  })

  it('shows close candidates when --close-missing is enabled', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const initialSnapshotPath = await writeSnapshotFile(projectRoot, 'beads-close-initial.json', [
      {
        externalTaskId: 'BEADS-9101',
        title: '继续保留',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-9102',
        title: '将被收口',
        status: 'doing',
        priority: 'P1',
        repository: 'frontend',
      },
    ])

    expect((await runCli(
      ['task', 'import-beads', '--file', initialSnapshotPath],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)

    const previewSnapshotPath = await writeSnapshotFile(projectRoot, 'beads-close-preview.json', [
      {
        externalTaskId: 'BEADS-9101',
        title: '继续保留',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
    ])

    const result = await runCli(
      ['task', 'diff-beads', '--file', previewSnapshotPath, '--close-missing'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- closed: 1')
    expect(result.stdout).toContain('[close] BEADS-9102')
  })

  it('reports rejected records without stopping preview', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const snapshotPath = await writeSnapshotFile(projectRoot, 'beads-invalid-preview.json', [
      {
        externalTaskId: 'BEADS-9201',
        title: '合法记录',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-9202',
        title: '非法状态',
        status: 'reviewing',
        priority: 'P2',
        repository: '.',
      },
    ])

    const result = await runCli(
      ['task', 'diff-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- created: 1')
    expect(result.stdout).toContain('- rejected: 1')
    expect(result.stdout).toContain('[create] BEADS-9201')
    expect(result.stdout).toContain('status 非法或缺失')
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'diff-beads', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task diff-beads')
    expect(result.stdout).toContain('fp task diff-beads')
    expect(result.stdout).toContain('--repository <repository-selector>')
    expect(result.stdout).toContain('--all-repositories')
    expect(result.stdout).toContain('--close-missing')
  })

  it('returns a clear error when no preview source is provided', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'diff-beads'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('file、repository 或 --all-repositories 必须提供其一')
  })

  it('supports live diff from a single local bd repository', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const initialSnapshotPath = await writeSnapshotFile(projectRoot, 'beads-live-seed.json', [
      {
        externalTaskId: 'BD-FE-1',
        title: '旧标题',
        status: 'ready',
        priority: 'P2',
        repository: 'frontend',
      },
    ])

    expect((await runCli(
      ['task', 'import-beads', '--file', initialSnapshotPath],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)

    const result = await runCli(
      ['task', 'diff-beads', '--repository', 'frontend'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          runBdList: async () => JSON.stringify([
            {
              id: 'BD-FE-1',
              title: '新标题',
              status: 'in_progress',
              priority: 1,
            },
            {
              id: 'BD-FE-2',
              title: '新增前端任务',
              status: 'open',
              priority: 2,
            },
          ]),
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- mode: single-repository')
    expect(result.stdout).toContain('- repository: frontend')
    expect(result.stdout).toContain('- created: 1')
    expect(result.stdout).toContain('- updated: 1')
    expect(result.stdout).toContain('[create] BD-FE-2')
    expect(result.stdout).toContain('[update] BD-FE-1')
  })

  it('supports live diff across all repositories and skips repos without local beads', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const frontendRepository = path.join(projectRoot, 'frontend')

    const result = await runCli(
      ['task', 'diff-beads', '--all-repositories'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          hasLocalBeadsRepository: async (input: { repositoryRoot: string }) => {
            return input.repositoryRoot === frontendRepository
          },
          runBdList: async () => JSON.stringify([
            {
              id: 'BD-FE-3',
              title: '跨仓库预览',
              status: 'blocked',
              priority: 2,
            },
          ]),
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- mode: all-repositories')
    expect(result.stdout).toContain('- scannedRepositories: 2')
    expect(result.stdout).toContain('- previewedRepositories: 1')
    expect(result.stdout).toContain('- skippedRepositories: 1')
    expect(result.stdout).toContain('- created: 1')
    expect(result.stdout).toContain('[create] BD-FE-3')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const snapshotPath = await writeSnapshotFile(projectRoot, 'beads-bootstrap-fail.json', [])

    const result = await runCli(
      ['task', 'diff-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
