import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

async function createManagedProjectWithRepositories(): Promise<{
  homeDir: string
  projectRoot: string
}> {
  const homeDir = await createTempDir('foxpilot-home-')
  const projectRoot = await createTempDir('foxpilot-project-')
  tempDirs.push(homeDir, projectRoot)

  await mkdir(path.join(projectRoot, '.git'), { recursive: true })
  await mkdir(path.join(projectRoot, 'frontend', '.git'), { recursive: true })

  const initResult = await runCli(
    ['init', '--path', projectRoot, '--workspace-root', path.dirname(projectRoot), '--mode', 'non-interactive'],
    { homeDir },
  )
  expect(initResult.exitCode).toBe(0)

  return { homeDir, projectRoot }
}

describe('task suggest-scan CLI', () => {
  it('creates one scan suggestion task per registered repository', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'suggest-scan'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已生成扫描建议任务')
    expect(result.stdout).toContain('- created: 2')
    expect(result.stdout).toContain('- skipped: 0')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const rows = db.prepare(`
      SELECT t.source_type, t.status, t.priority, t.task_type, t.current_executor, r.path AS repository_path
      FROM task t
      JOIN task_target tt ON tt.task_id = t.id
      JOIN repository r ON r.id = tt.repository_id
      WHERE t.source_type = 'scan_suggestion'
      ORDER BY r.path ASC
    `).all() as Array<{
      source_type: string
      status: string
      priority: string
      task_type: string
      current_executor: string
      repository_path: string
    }>

    expect(rows).toEqual([
      {
        source_type: 'scan_suggestion',
        status: 'todo',
        priority: 'P2',
        task_type: 'init',
        current_executor: 'none',
        repository_path: '.',
      },
      {
        source_type: 'scan_suggestion',
        status: 'todo',
        priority: 'P2',
        task_type: 'init',
        current_executor: 'none',
        repository_path: 'frontend',
      },
    ])

    db.close()
  })

  it('skips repositories that already have unfinished scan suggestion tasks', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const firstRun = await runCli(
      ['task', 'suggest-scan'],
      { cwd: projectRoot, homeDir },
    )
    expect(firstRun.exitCode).toBe(0)

    const secondRun = await runCli(
      ['task', 'suggest-scan'],
      { cwd: projectRoot, homeDir },
    )

    expect(secondRun.exitCode).toBe(0)
    expect(secondRun.stdout).toContain('- created: 0')
    expect(secondRun.stdout).toContain('- skipped: 2')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare(`
      SELECT COUNT(*) AS count
      FROM task
      WHERE source_type = 'scan_suggestion'
    `).get() as { count: number }

    expect(row.count).toBe(2)
    db.close()
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'suggest-scan', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task suggest-scan')
    expect(result.stdout).toContain('fp task suggest-scan')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(
      ['task', 'suggest-scan'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'suggest-scan'],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })

  it('returns structured json scan suggestion output', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'suggest-scan', '--json'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)

    const payload = JSON.parse(result.stdout) as {
      ok: true
      command: string
      data: {
        projectRoot: string
        created: number
        skipped: number
      }
    }

    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task suggest-scan')
    expect(payload.data.projectRoot).toBe(projectRoot)
    expect(payload.data.created).toBe(2)
    expect(payload.data.skipped).toBe(0)
  })
})
