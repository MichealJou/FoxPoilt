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

describe('task import-beads CLI', () => {
  it('imports beads tasks from a local json snapshot', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const snapshotPath = await writeSnapshotFile(projectRoot, 'beads-snapshot.json', [
      {
        externalTaskId: 'BEADS-101',
        title: '接入 Beads 导入命令',
        status: 'ready',
        priority: 'P1',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-102',
        title: '补齐前端仓库扫描',
        status: 'doing',
        priority: 'P2',
        repository: 'frontend',
      },
    ])

    const result = await runCli(
      ['task', 'import-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已完成 Beads 任务导入')
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
        t.source_type,
        t.status,
        t.priority,
        t.current_executor,
        t.execution_mode,
        t.requires_plan_confirm,
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
      source_type: string
      status: string
      priority: string
      current_executor: string
      execution_mode: string
      requires_plan_confirm: number
      repository_path: string
    }>

    expect(rows).toEqual([
      {
        external_source: 'beads',
        external_id: 'BEADS-101',
        title: '接入 Beads 导入命令',
        source_type: 'beads_sync',
        status: 'todo',
        priority: 'P1',
        current_executor: 'beads',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        repository_path: '.',
      },
      {
        external_source: 'beads',
        external_id: 'BEADS-102',
        title: '补齐前端仓库扫描',
        source_type: 'beads_sync',
        status: 'executing',
        priority: 'P2',
        current_executor: 'beads',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        repository_path: 'frontend',
      },
    ])

    db.close()
  })

  it('treats unchanged beads records as skipped on repeated import', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const snapshotPath = await writeSnapshotFile(projectRoot, 'beads-snapshot.json', [
      {
        externalTaskId: 'BEADS-201',
        title: '第一次导入',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-202',
        title: '继续执行',
        status: 'doing',
        priority: 'P1',
        repository: 'frontend',
      },
    ])

    const firstRun = await runCli(
      ['task', 'import-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir },
    )
    expect(firstRun.exitCode).toBe(0)

    const secondRun = await runCli(
      ['task', 'import-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir },
    )

    expect(secondRun.exitCode).toBe(0)
    expect(secondRun.stdout).toContain('- created: 0')
    expect(secondRun.stdout).toContain('- updated: 0')
    expect(secondRun.stdout).toContain('- skipped: 2')
    expect(secondRun.stdout).toContain('- rejected: 0')
  })

  it('updates an existing imported task when the external snapshot changes', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const initialSnapshotPath = await writeSnapshotFile(projectRoot, 'beads-initial.json', [
      {
        externalTaskId: 'BEADS-301',
        title: '旧标题',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-302',
        title: '保持不变',
        status: 'doing',
        priority: 'P1',
        repository: 'frontend',
      },
    ])

    const firstRun = await runCli(
      ['task', 'import-beads', '--file', initialSnapshotPath],
      { cwd: projectRoot, homeDir },
    )
    expect(firstRun.exitCode).toBe(0)

    const updatedSnapshotPath = await writeSnapshotFile(projectRoot, 'beads-updated.json', [
      {
        externalTaskId: 'BEADS-301',
        title: '新标题',
        status: 'done',
        priority: 'P0',
        repository: 'frontend',
      },
      {
        externalTaskId: 'BEADS-302',
        title: '保持不变',
        status: 'doing',
        priority: 'P1',
        repository: 'frontend',
      },
    ])

    const secondRun = await runCli(
      ['task', 'import-beads', '--file', updatedSnapshotPath],
      { cwd: projectRoot, homeDir },
    )

    expect(secondRun.exitCode).toBe(0)
    expect(secondRun.stdout).toContain('- created: 0')
    expect(secondRun.stdout).toContain('- updated: 1')
    expect(secondRun.stdout).toContain('- skipped: 1')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare(`
      SELECT
        t.title,
        t.status,
        t.priority,
        r.path AS repository_path
      FROM task t
      JOIN task_target tt ON tt.task_id = t.id
      JOIN repository r ON r.id = tt.repository_id
      WHERE t.external_source = 'beads'
        AND t.external_id = 'BEADS-301'
      LIMIT 1
    `).get() as {
      title: string
      status: string
      priority: string
      repository_path: string
    }

    expect(row).toEqual({
      title: '新标题',
      status: 'done',
      priority: 'P0',
      repository_path: 'frontend',
    })

    db.close()
  })

  it('rejects malformed records and continues importing valid ones', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const snapshotPath = await writeSnapshotFile(projectRoot, 'beads-invalid.json', [
      {
        externalTaskId: 'BEADS-401',
        title: '合法记录',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
      {
        title: '缺少 externalTaskId',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-403',
        title: '状态非法',
        status: 'reviewing',
        priority: 'P2',
        repository: '.',
      },
      {
        externalTaskId: 'BEADS-404',
        title: '仓库不存在',
        status: 'ready',
        priority: 'P2',
        repository: 'unknown-repo',
      },
    ])

    const result = await runCli(
      ['task', 'import-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- created: 1')
    expect(result.stdout).toContain('- updated: 0')
    expect(result.stdout).toContain('- skipped: 0')
    expect(result.stdout).toContain('- rejected: 3')
    expect(result.stdout).toContain('externalTaskId')
    expect(result.stdout).toContain('status')
    expect(result.stdout).toContain('repository')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare(`
      SELECT COUNT(*) AS count
      FROM task
      WHERE source_type = 'beads_sync'
    `).get() as { count: number }
    expect(row.count).toBe(1)
    db.close()
  })

  it('isolates import idempotency by project', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    tempDirs.push(homeDir)

    const firstProject = await createManagedProjectWithRepositories(homeDir)
    const secondProject = await createManagedProjectWithRepositories(homeDir)

    const firstSnapshotPath = await writeSnapshotFile(firstProject.projectRoot, 'beads-project-a.json', [
      {
        externalTaskId: 'BEADS-501',
        title: '项目 A 的任务',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
    ])

    const secondSnapshotPath = await writeSnapshotFile(secondProject.projectRoot, 'beads-project-b.json', [
      {
        externalTaskId: 'BEADS-501',
        title: '项目 B 的任务',
        status: 'ready',
        priority: 'P2',
        repository: '.',
      },
    ])

    const firstResult = await runCli(
      ['task', 'import-beads', '--file', firstSnapshotPath],
      { cwd: firstProject.projectRoot, homeDir },
    )
    expect(firstResult.exitCode).toBe(0)

    const secondResult = await runCli(
      ['task', 'import-beads', '--file', secondSnapshotPath],
      { cwd: secondProject.projectRoot, homeDir },
    )
    expect(secondResult.exitCode).toBe(0)
    expect(secondResult.stdout).toContain('- created: 1')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const rows = db.prepare(`
      SELECT project_id, title
      FROM task
      WHERE external_source = 'beads'
        AND external_id = 'BEADS-501'
      ORDER BY project_id ASC
    `).all() as Array<{
      project_id: string
      title: string
    }>

    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.title).sort()).toEqual(['项目 A 的任务', '项目 B 的任务'])
    db.close()
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'import-beads', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task import-beads')
    expect(result.stdout).toContain('fp task import-beads')
    expect(result.stdout).toContain('--file <json-file>')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    const snapshotPath = await writeSnapshotFile(projectRoot, 'beads.json', [])
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(
      ['task', 'import-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const snapshotPath = await writeSnapshotFile(projectRoot, 'beads.json', [])

    const result = await runCli(
      ['task', 'import-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
