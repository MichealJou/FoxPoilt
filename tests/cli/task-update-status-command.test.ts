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

async function createManagedProjectWithTask(): Promise<{
  homeDir: string
  projectRoot: string
  taskId: string
}> {
  const homeDir = await createTempDir('foxpilot-home-')
  const projectRoot = await createTempDir('foxpilot-project-')
  tempDirs.push(homeDir, projectRoot)

  await mkdir(path.join(projectRoot, '.git'), { recursive: true })

  const initResult = await runCli(
    ['init', '--path', projectRoot, '--workspace-root', path.dirname(projectRoot), '--mode', 'non-interactive', '--no-scan'],
    { homeDir },
  )
  expect(initResult.exitCode).toBe(0)

  const createResult = await runCli(
    ['task', 'create', '--title', '需要推进状态'],
    { cwd: projectRoot, homeDir },
  )
  expect(createResult.exitCode).toBe(0)

  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  const row = db.prepare('SELECT id FROM task LIMIT 1').get() as { id: string }
  db.close()

  return { homeDir, projectRoot, taskId: row.id }
}

describe('task update-status CLI', () => {
  it('updates a task status in the current managed project', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已更新任务状态')
    expect(result.stdout).toContain('analyzing')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT status FROM task WHERE id = ?').get(taskId) as { status: string }
    expect(row.status).toBe('analyzing')
    const taskRun = db.prepare(`
      SELECT run_type, executor, status, ended_at
      FROM task_run
      WHERE task_id = ?
      ORDER BY started_at DESC
      LIMIT 1
    `).get(taskId) as {
      run_type: string
      executor: string
      status: string
      ended_at: string | null
    }
    expect(taskRun).toMatchObject({
      run_type: 'analysis',
      executor: 'manual',
      status: 'running',
      ended_at: null,
    })
    db.close()
  })

  it('closes the latest analysis run when status moves to awaiting_plan_confirm', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const analyzingResult = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )
    expect(analyzingResult.exitCode).toBe(0)

    const confirmResult = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'awaiting_plan_confirm'],
      { cwd: projectRoot, homeDir },
    )
    expect(confirmResult.exitCode).toBe(0)

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const taskRun = db.prepare(`
      SELECT run_type, status, ended_at
      FROM task_run
      WHERE task_id = ?
      ORDER BY started_at DESC
      LIMIT 1
    `).get(taskId) as {
      run_type: string
      status: string
      ended_at: string | null
    }
    expect(taskRun.run_type).toBe('analysis')
    expect(taskRun.status).toBe('success')
    expect(taskRun.ended_at).not.toBeNull()
    db.close()
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'update-status', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task update-status')
    expect(result.stdout).toContain('fp task update-status')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(
      ['task', 'update-status', '--id', 'task:missing', '--status', 'done'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('does not update a task from another project', async () => {
    const first = await createManagedProjectWithTask()
    const second = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-status', '--id', second.taskId, '--status', 'done'],
      { cwd: first.projectRoot, homeDir: first.homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('未找到任务')
  })

  it('fails fast when status is invalid', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'invalid-status'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('status 非法或缺失')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'done'],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })

  it('rejects an invalid direct transition from todo to done', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'done'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('状态流转不合法')
    expect(result.stdout).toContain('from: todo')
    expect(result.stdout).toContain('to: done')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT status FROM task WHERE id = ?').get(taskId) as { status: string }
    expect(row.status).toBe('todo')
    db.close()
  })

  it('rejects any transition after the task is done', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    expect((await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)
    expect((await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'awaiting_plan_confirm'],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)
    expect((await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'executing'],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)
    expect((await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'awaiting_result_confirm'],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)
    expect((await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'done'],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)

    const result = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('状态流转不合法')
    expect(result.stdout).toContain('from: done')
    expect(result.stdout).toContain('to: analyzing')
  })

  it('allows blocked tasks to return to analyzing', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    expect((await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'blocked'],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)

    const result = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('from: blocked')
    expect(result.stdout).toContain('to: analyzing')
  })

  it('does not create duplicate task runs when the status is unchanged', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    expect((await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )).exitCode).toBe(0)

    const result = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('任务状态未变化')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const taskRunCountRow = db.prepare('SELECT COUNT(*) AS count FROM task_run WHERE task_id = ?').get(taskId) as {
      count: number
    }
    expect(taskRunCountRow.count).toBe(1)
    db.close()
  })
})
