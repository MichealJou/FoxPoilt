import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import Database from 'better-sqlite3'
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

describe('task sync-beads CLI', () => {
  it('从本地 bd list 输出同步单仓库任务', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const repositoryRoot = path.join(projectRoot, 'frontend')

    const result = await runCli(
      ['task', 'sync-beads', '--repository', 'frontend'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          runBdList: async (input: { repositoryRoot: string }) => {
            expect(input.repositoryRoot).toBe(repositoryRoot)

            return JSON.stringify([
              {
                id: 'bd-fe-101',
                title: '补齐前端提交流程',
                status: 'open',
                priority: 1,
              },
              {
                id: 'bd-fe-102',
                title: '联调发布回归',
                status: 'in_progress',
                priority: 4,
              },
            ])
          },
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已完成本地 Beads 同步')
    expect(result.stdout).toContain('- repository: frontend')
    expect(result.stdout).toContain('- created: 2')
    expect(result.stdout).toContain('- updated: 0')
    expect(result.stdout).toContain('- skipped: 0')
    expect(result.stdout).toContain('- rejected: 0')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const rows = db.prepare(`
      SELECT
        t.external_source,
        t.external_id,
        t.title,
        t.status,
        t.priority,
        r.path AS repository_path
      FROM task t
      JOIN task_target tt ON tt.task_id = t.id
      JOIN repository r ON r.id = tt.repository_id
      WHERE t.source_type = 'beads_sync'
      ORDER BY t.external_id ASC
    `).all() as Array<{
      external_source: string | null
      external_id: string | null
      title: string
      status: string
      priority: string
      repository_path: string
    }>
    db.close()

    expect(rows).toEqual([
      {
        external_source: 'beads',
        external_id: 'bd-fe-101',
        title: '补齐前端提交流程',
        status: 'todo',
        priority: 'P1',
        repository_path: 'frontend',
      },
      {
        external_source: 'beads',
        external_id: 'bd-fe-102',
        title: '联调发布回归',
        status: 'executing',
        priority: 'P3',
        repository_path: 'frontend',
      },
    ])
  })

  it('支持 dry-run 且不真正写库', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'sync-beads', '--repository', 'frontend', '--dry-run'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          runBdList: async () => JSON.stringify([
            {
              id: 'bd-fe-201',
              title: '只预演不同步',
              status: 'open',
              priority: 2,
            },
          ]),
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- dryRun: true')
    expect(result.stdout).toContain('- created: 1')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare(`
      SELECT COUNT(*) AS count
      FROM task
      WHERE external_id = 'bd-fe-201'
    `).get() as { count: number }
    db.close()

    expect(row.count).toBe(0)
  })

  it('close-missing 只收口当前仓库下缺失的 beads 任务', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const snapshotPath = await writeSnapshotFile(projectRoot, 'beads-seed.json', [
      {
        externalTaskId: 'BEADS-ROOT-1',
        title: '根仓库任务',
        status: 'ready',
        priority: 'P1',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-FE-1',
        title: '前端保留任务',
        status: 'ready',
        priority: 'P1',
        repository: 'frontend',
      },
      {
        externalTaskId: 'BEADS-FE-2',
        title: '前端待收口任务',
        status: 'doing',
        priority: 'P2',
        repository: 'frontend',
      },
    ])

    const importResult = await runCli(
      ['task', 'import-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir },
    )
    expect(importResult.exitCode).toBe(0)

    const syncResult = await runCli(
      ['task', 'sync-beads', '--repository', 'frontend', '--close-missing'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          runBdList: async () => JSON.stringify([
            {
              id: 'BEADS-FE-1',
              title: '前端保留任务',
              status: 'open',
              priority: 1,
            },
          ]),
        },
      },
    )

    expect(syncResult.exitCode).toBe(0)
    expect(syncResult.stdout).toContain('- closed: 1')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const rows = db.prepare(`
      SELECT external_id, status
      FROM task
      WHERE external_source = 'beads'
      ORDER BY external_id ASC
    `).all() as Array<{ external_id: string; status: string }>
    db.close()

    expect(rows).toEqual([
      { external_id: 'BEADS-FE-1', status: 'todo' },
      { external_id: 'BEADS-FE-2', status: 'cancelled' },
      { external_id: 'BEADS-ROOT-1', status: 'todo' },
    ])
  })

  it('在多仓库项目里未传 repository 时返回错误', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'sync-beads'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('[FoxPilot] 本地 Beads 同步失败: repository 或 --all-repositories 必须提供其一')
  })

  it('支持帮助输出与 fp 简写入口', async () => {
    const result = await runCli(
      ['task', 'sync-beads', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task sync-beads')
    expect(result.stdout).toContain('fp task sync-beads')
    expect(result.stdout).toContain('--repository <repository-selector>')
    expect(result.stdout).toContain('--all-repositories')
  })

  it('支持一次同步所有已初始化 beads 的仓库', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const rootRepository = projectRoot
    const frontendRepository = path.join(projectRoot, 'frontend')

    const result = await runCli(
      ['task', 'sync-beads', '--all-repositories'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          hasLocalBeadsRepository: async (input: { repositoryRoot: string }) => {
            return input.repositoryRoot === rootRepository || input.repositoryRoot === frontendRepository
          },
          runBdList: async (input: { repositoryRoot: string }) => {
            if (input.repositoryRoot === rootRepository) {
              return JSON.stringify([
                {
                  id: 'bd-root-1',
                  title: '根仓库 beads 任务',
                  status: 'open',
                  priority: 1,
                },
              ])
            }

            return JSON.stringify([
              {
                id: 'bd-fe-301',
                title: '前端 beads 任务',
                status: 'blocked',
                priority: 2,
              },
            ])
          },
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- mode: all-repositories')
    expect(result.stdout).toContain('- scannedRepositories: 2')
    expect(result.stdout).toContain('- syncedRepositories: 2')
    expect(result.stdout).toContain('- skippedRepositories: 0')
    expect(result.stdout).toContain('- created: 2')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const rows = db.prepare(`
      SELECT t.external_id, t.status, r.path AS repository_path
      FROM task t
      JOIN task_target tt ON tt.task_id = t.id
      JOIN repository r ON r.id = tt.repository_id
      WHERE t.external_source = 'beads'
      ORDER BY t.external_id ASC
    `).all() as Array<{ external_id: string; status: string; repository_path: string }>
    db.close()

    expect(rows).toEqual([
      { external_id: 'bd-fe-301', status: 'blocked', repository_path: 'frontend' },
      { external_id: 'bd-root-1', status: 'todo', repository_path: '.' },
    ])
  })

  it('在 all-repositories 模式下自动跳过没有初始化 beads 的仓库', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const frontendRepository = path.join(projectRoot, 'frontend')

    const result = await runCli(
      ['task', 'sync-beads', '--all-repositories'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          hasLocalBeadsRepository: async (input: { repositoryRoot: string }) => {
            return input.repositoryRoot === frontendRepository
          },
          runBdList: async () => JSON.stringify([
            {
              id: 'bd-fe-401',
              title: '只有前端启用 beads',
              status: 'open',
              priority: 1,
            },
          ]),
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- scannedRepositories: 2')
    expect(result.stdout).toContain('- syncedRepositories: 1')
    expect(result.stdout).toContain('- skippedRepositories: 1')
    expect(result.stdout).toContain('- created: 1')
  })

  it('在调用 bd 失败时返回稳定错误', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'sync-beads', '--repository', 'frontend'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          runBdList: async () => {
            throw new Error('Injected bd list failure')
          },
        },
      },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('[FoxPilot] 本地 Beads 同步失败: 无法读取 bd list 输出')
  })

  it('在 foxpilot.db 初始化失败时返回 exitCode 4', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'sync-beads', '--repository', 'frontend'],
      {
        cwd: projectRoot,
        homeDir,
        failBootstrap: true,
        dependencies: {
          runBdList: async () => JSON.stringify([]),
        },
      },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('[FoxPilot] 本地 Beads 同步失败: foxpilot.db 初始化失败')
  })

  it('返回结构化 json beads 同步结果', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'sync-beads', '--repository', 'frontend', '--json'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          runBdList: async () => JSON.stringify([
            {
              id: 'bd-fe-json-1',
              title: 'JSON 同步任务',
              status: 'open',
              priority: 2,
            },
          ]),
        },
      },
    )

    expect(result.exitCode).toBe(0)

    const payload = JSON.parse(result.stdout) as {
      ok: true
      command: string
      data: {
        projectRoot: string
        mode: string
        repositoryPath: string
        dryRun: boolean
        created: number
        updated: number
        skipped: number
        closed: number
        rejected: string[]
      }
    }

    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task sync-beads')
    expect(payload.data.projectRoot).toBe(projectRoot)
    expect(payload.data.mode).toBe('single-repository')
    expect(payload.data.repositoryPath).toBe('frontend')
    expect(payload.data.dryRun).toBe(false)
    expect(payload.data.created).toBe(1)
    expect(payload.data.updated).toBe(0)
    expect(payload.data.skipped).toBe(0)
    expect(payload.data.closed).toBe(0)
    expect(payload.data.rejected).toEqual([])
  })
})
