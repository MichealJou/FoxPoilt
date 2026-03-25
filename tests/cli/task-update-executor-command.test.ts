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
    ['task', 'create', '--title', '需要切换执行器'],
    { cwd: projectRoot, homeDir },
  )
  expect(createResult.exitCode).toBe(0)

  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  const row = db.prepare('SELECT id FROM task LIMIT 1').get() as { id: string }
  db.close()

  return { homeDir, projectRoot, taskId: row.id }
}

describe('task update-executor CLI', () => {
  it('updates a task executor in the current managed project', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-executor', '--id', taskId, '--executor', 'beads'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已更新任务执行器')
    expect(result.stdout).toContain('from: codex')
    expect(result.stdout).toContain('to: beads')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT current_executor FROM task WHERE id = ?').get(taskId) as {
      current_executor: string
    }
    expect(row.current_executor).toBe('beads')
    db.close()
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'update-executor', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task update-executor')
    expect(result.stdout).toContain('fp task update-executor')
  })

  it('fails fast when executor is invalid', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-executor', '--id', taskId, '--executor', 'invalid-executor'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('executor 非法或缺失')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(
      ['task', 'update-executor', '--id', 'task:missing', '--executor', 'beads'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('does not update a task from another project', async () => {
    const first = await createManagedProjectWithTask()
    const second = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-executor', '--id', second.taskId, '--executor', 'beads'],
      { cwd: first.projectRoot, homeDir: first.homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('未找到任务')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-executor', '--id', taskId, '--executor', 'beads'],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })

  it('does not rewrite the task when executor is unchanged', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-executor', '--id', taskId, '--executor', 'codex'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('任务执行器未变化')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT current_executor FROM task WHERE id = ?').get(taskId) as {
      current_executor: string
    }
    expect(row.current_executor).toBe('codex')
    db.close()
  })
})
