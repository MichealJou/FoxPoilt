import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

async function createManagedProjectFixture(): Promise<{
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

describe('task create CLI', () => {
  it('creates a manual task for the current managed project', async () => {
    const { homeDir, projectRoot } = await createManagedProjectFixture()

    const result = await runCli(
      ['task', 'create', '--title', '整理 init 后续工作'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已创建任务')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db
      .prepare('SELECT title, source_type, status, priority, task_type, current_executor FROM task')
      .get() as {
      title: string
      source_type: string
      status: string
      priority: string
      task_type: string
      current_executor: string
    }

    expect(row.title).toBe('整理 init 后续工作')
    expect(row.source_type).toBe('manual')
    expect(row.status).toBe('todo')
    expect(row.priority).toBe('P2')
    expect(row.task_type).toBe('generic')
    expect(row.current_executor).toBe('codex')

    db.close()
  })

  it('creates a repository target when --repository is provided', async () => {
    const { homeDir, projectRoot } = await createManagedProjectFixture()

    const result = await runCli(
      ['task', 'create', '--title', '补 frontend 任务', '--repository', 'frontend'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('targets: 1')

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db
      .prepare(
        `
        SELECT tt.target_type, r.path AS repository_path
        FROM task_target tt
        JOIN repository r ON r.id = tt.repository_id
        LIMIT 1
        `,
      )
      .get() as {
      target_type: string
      repository_path: string
    }

    expect(row.target_type).toBe('repository')
    expect(row.repository_path).toBe('frontend')

    db.close()
  })

  it('resolves the managed project through --path', async () => {
    const { homeDir, projectRoot } = await createManagedProjectFixture()
    const outsideDir = await createTempDir('foxpilot-outside-')
    tempDirs.push(outsideDir)

    const result = await runCli(
      ['task', 'create', '--path', projectRoot, '--title', '从外部目录登记任务'],
      { cwd: outsideDir, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain(projectRoot)
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(
      ['task', 'create', '--title', '未初始化项目任务'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('prints usage for task create help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'create', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task create')
    expect(result.stdout).toContain('fp task create')
  })

  it('stores description when provided', async () => {
    const { homeDir, projectRoot } = await createManagedProjectFixture()

    const result = await runCli(
      ['task', 'create', '--title', '补充描述任务', '--description', '需要先写 spec'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)

    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT description FROM task ORDER BY created_at DESC LIMIT 1').get() as {
      description: string
    }

    expect(row.description).toBe('需要先写 spec')

    db.close()
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot } = await createManagedProjectFixture()

    const result = await runCli(
      ['task', 'create', '--title', '数据库失败任务'],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
