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
    [
      'init',
      '--path',
      projectRoot,
      '--workspace-root',
      path.dirname(projectRoot),
      '--mode',
      'non-interactive',
      '--no-scan',
    ],
    { homeDir },
  )
  expect(initResult.exitCode).toBe(0)

  const createResult = await runCli(
    ['task', 'create', '--title', '初始标题', '--description', '初始描述', '--task-type', 'docs'],
    { cwd: projectRoot, homeDir },
  )
  expect(createResult.exitCode).toBe(0)

  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  const row = db.prepare('SELECT id FROM task LIMIT 1').get() as { id: string }
  db.close()

  return { homeDir, projectRoot, taskId: row.id }
}

describe('task edit CLI', () => {
  it('updates title, description, and task type in the current managed project', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      [
        'task',
        'edit',
        '--id',
        taskId,
        '--title',
        '更新后标题',
        '--description',
        '更新后描述',
        '--task-type',
        'backend',
      ],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已更新任务元数据')
    expect(result.stdout).toContain('title: 更新后标题')
    expect(result.stdout).toContain('taskType: backend')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db
      .prepare('SELECT title, description, task_type FROM task WHERE id = ?')
      .get(taskId) as {
      title: string
      description: string | null
      task_type: string
    }
    expect(row).toEqual({
      title: '更新后标题',
      description: '更新后描述',
      task_type: 'backend',
    })
    db.close()
  })

  it('clears description when --clear-description is passed', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(['task', 'edit', '--id', taskId, '--clear-description'], {
      cwd: projectRoot,
      homeDir,
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('description: (cleared)')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT description FROM task WHERE id = ?').get(taskId) as {
      description: string | null
    }
    expect(row.description).toBeNull()
    db.close()
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(['task', 'edit', '--help'], { binName: 'fp' })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task edit')
    expect(result.stdout).toContain('fp task edit')
    expect(result.stdout).toContain('--clear-description')
  })

  it('fails when no editable field is provided', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(['task', 'edit', '--id', taskId], { cwd: projectRoot, homeDir })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('至少指定一个可编辑字段')
  })

  it('fails when description flags conflict', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'edit', '--id', taskId, '--description', '新的描述', '--clear-description'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('description 参数冲突')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(['task', 'edit', '--id', 'task:missing', '--title', '新标题'], {
      cwd: projectRoot,
      homeDir,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('does not update a task from another project', async () => {
    const first = await createManagedProjectWithTask()
    const second = await createManagedProjectWithTask()

    const result = await runCli(['task', 'edit', '--id', second.taskId, '--title', '串项目修改'], {
      cwd: first.projectRoot,
      homeDir: first.homeDir,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('未找到任务')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(['task', 'edit', '--id', taskId, '--title', '新标题'], {
      cwd: projectRoot,
      homeDir,
      failBootstrap: true,
    })

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })

  it('does not rewrite the task when metadata is unchanged', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      [
        'task',
        'edit',
        '--id',
        taskId,
        '--title',
        '初始标题',
        '--description',
        '初始描述',
        '--task-type',
        'docs',
      ],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('任务元数据未变化')
  })

  it('supports editing imported tasks by external task id', async () => {
    const { homeDir, projectRoot, taskId, externalId } =
      await createManagedProjectWithImportedBeadsTask({
        tempDirs,
        externalTaskId: 'BEADS-901',
        title: '原始外部标题',
        priority: 'P2',
      })

    const result = await runCli(
      [
        'task',
        'edit',
        '--external-id',
        externalId,
        '--title',
        '更新后的外部标题',
        '--task-type',
        'backend',
      ],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('更新后的外部标题')
    expect(result.stdout).toContain('taskType: backend')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT title, task_type FROM task WHERE id = ?').get(taskId) as {
      title: string
      task_type: string
    }
    expect(row).toEqual({
      title: '更新后的外部标题',
      task_type: 'backend',
    })
    db.close()
  })

  it('returns structured json task edit output', async () => {
    const { homeDir, projectRoot, taskId } = await createManagedProjectWithTask()

    const result = await runCli(
      ['task', 'edit', '--id', taskId, '--title', 'JSON 标题', '--json'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)

    const payload = JSON.parse(result.stdout) as {
      ok: true
      command: string
      data: {
        projectRoot: string
        taskId: string
        changed: boolean
        before: {
          title: string
          taskType: string
        }
        after: {
          title: string
          taskType: string
        }
      }
    }

    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task edit')
    expect(payload.data.projectRoot).toBe(projectRoot)
    expect(payload.data.taskId).toBe(taskId)
    expect(payload.data.changed).toBe(true)
    expect(payload.data.before.title).toBe('初始标题')
    expect(payload.data.after.title).toBe('JSON 标题')
    expect(payload.data.before.taskType).toBe('docs')
    expect(payload.data.after.taskType).toBe('docs')
  })
})
