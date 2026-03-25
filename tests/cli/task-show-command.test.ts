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

async function createManagedProjectWithDetailedTask(): Promise<{
  homeDir: string
  projectRoot: string
  taskId: string
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

  const createResult = await runCli(
    ['task', 'create', '--title', '查看单任务', '--description', '把详情展示清楚', '--repository', 'frontend'],
    { cwd: projectRoot, homeDir },
  )
  expect(createResult.exitCode).toBe(0)

  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  const row = db.prepare('SELECT id FROM task LIMIT 1').get() as { id: string }
  db.close()

  return { homeDir, projectRoot, taskId: row.id }
}

describe('task show CLI', () => {
  it('shows a single task detail for the current managed project', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithDetailedTask()

    const result = await runCli(
      ['task', 'show', '--id', taskId],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 任务详情')
    expect(result.stdout).toContain('查看单任务')
    expect(result.stdout).toContain('把详情展示清楚')
    expect(result.stdout).toContain('updatedAt')
    expect(result.stdout).toContain('frontend')
    expect(result.stdout).toContain('暂无运行历史')
  })

  it('shows task run history when runs already exist', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithDetailedTask()

    const updateResult = await runCli(
      ['task', 'update-status', '--id', taskId, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )
    expect(updateResult.exitCode).toBe(0)

    const result = await runCli(
      ['task', 'show', '--id', taskId],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('任务运行历史')
    expect(result.stdout).toContain('analysis')
    expect(result.stdout).toContain('running')
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'show', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task show')
    expect(result.stdout).toContain('fp task show')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(
      ['task', 'show', '--id', 'task:missing'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('does not show a task from another project', async () => {
    const first = await createManagedProjectWithDetailedTask()
    const second = await createManagedProjectWithDetailedTask()

    const result = await runCli(
      ['task', 'show', '--id', second.taskId],
      { cwd: first.projectRoot, homeDir: first.homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('未找到任务')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithDetailedTask()

    const result = await runCli(
      ['task', 'show', '--id', taskId],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
