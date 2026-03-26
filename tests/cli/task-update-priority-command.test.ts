import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'

import { createManagedProjectWithImportedBeadsTask } from '@tests/helpers/imported-beads-task.js'
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
    ['task', 'create', '--title', '需要调高优先级'],
    { cwd: projectRoot, homeDir },
  )
  expect(createResult.exitCode).toBe(0)

  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  const row = db.prepare('SELECT id FROM task LIMIT 1').get() as { id: string }
  db.close()

  return { homeDir, projectRoot, taskId: row.id }
}

describe('task update-priority CLI', () => {
  it('updates a task priority in the current managed project', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-priority', '--id', taskId, '--priority', 'P0'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已更新任务优先级')
    expect(result.stdout).toContain('from: P2')
    expect(result.stdout).toContain('to: P0')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT priority FROM task WHERE id = ?').get(taskId) as {
      priority: string
    }
    expect(row.priority).toBe('P0')
    db.close()
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'update-priority', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task update-priority')
    expect(result.stdout).toContain('fp task update-priority')
  })

  it('fails fast when priority is invalid', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-priority', '--id', taskId, '--priority', 'PX'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('priority 非法或缺失')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(
      ['task', 'update-priority', '--id', 'task:missing', '--priority', 'P0'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('does not update a task from another project', async () => {
    const first = await createManagedProjectWithTask()
    const second = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-priority', '--id', second.taskId, '--priority', 'P0'],
      { cwd: first.projectRoot, homeDir: first.homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('未找到任务')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-priority', '--id', taskId, '--priority', 'P0'],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })

  it('does not rewrite the task when priority is unchanged', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'update-priority', '--id', taskId, '--priority', 'P2'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('任务优先级未变化')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT priority FROM task WHERE id = ?').get(taskId) as {
      priority: string
    }
    expect(row.priority).toBe('P2')
    db.close()
  })

  it('supports updating imported tasks by external task id', async () => {
    const { homeDir, projectRoot, taskId, externalId } = await createManagedProjectWithImportedBeadsTask({
      tempDirs,
      externalTaskId: 'BEADS-1201',
      title: '外部号提优先级',
      priority: 'P2',
    })

    const result = await runCli(
      ['task', 'update-priority', '--external-id', externalId, '--priority', 'P0'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('from: P2')
    expect(result.stdout).toContain('to: P0')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT priority FROM task WHERE id = ?').get(taskId) as {
      priority: string
    }
    expect(row.priority).toBe('P0')
    db.close()
  })
})
