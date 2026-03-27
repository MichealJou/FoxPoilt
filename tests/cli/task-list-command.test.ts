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

async function createManagedProjectWithTasks(): Promise<{
  homeDir: string
  projectRoot: string
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

  const firstTask = await runCli(
    ['task', 'create', '--title', '先做 task list'],
    { cwd: projectRoot, homeDir },
  )
  expect(firstTask.exitCode).toBe(0)

  const secondTask = await runCli(
    ['task', 'create', '--title', '整理 task 输出'],
    { cwd: projectRoot, homeDir },
  )
  expect(secondTask.exitCode).toBe(0)

  return { homeDir, projectRoot }
}

describe('task list CLI', () => {
  it('lists tasks for the current managed project', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()

    const result = await runCli(
      ['task', 'list'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 任务列表')
    expect(result.stdout).toContain('先做 task list')
    expect(result.stdout).toContain('整理 task 输出')
  })

  it('supports filtering by status', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()

    const result = await runCli(
      ['task', 'list', '--status', 'done'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 当前没有匹配任务')
  })

  it('supports filtering by executor', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()
    const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
    const row = db.prepare('SELECT id FROM task ORDER BY created_at ASC LIMIT 1').get() as { id: string }
    db.close()

    const updateExecutor = await runCli(
      ['task', 'update-executor', '--id', row.id, '--executor', 'beads'],
      { cwd: projectRoot, homeDir },
    )
    expect(updateExecutor.exitCode).toBe(0)

    const result = await runCli(
      ['task', 'list', '--executor', 'beads'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('先做 task list')
    expect(result.stdout).not.toContain('整理 task 输出')
  })

  it('supports filtering by source', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()

    const suggestScan = await runCli(
      ['task', 'suggest-scan'],
      { cwd: projectRoot, homeDir },
    )
    expect(suggestScan.exitCode).toBe(0)

    const result = await runCli(
      ['task', 'list', '--source', 'scan_suggestion'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('扫描建议')
    expect(result.stdout).not.toContain('先做 task list')
  })

  it('shows external reference markers for imported beads tasks', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()
    const snapshotPath = path.join(projectRoot, 'beads.json')

    await writeFile(snapshotPath, `${JSON.stringify([
      {
        externalTaskId: 'BEADS-801',
        title: '外部同步任务',
        status: 'doing',
        priority: 'P1',
        repository: '.',
      },
    ], null, 2)}\n`, 'utf8')

    const importResult = await runCli(
      ['task', 'import-beads', '--file', snapshotPath],
      { cwd: projectRoot, homeDir },
    )
    expect(importResult.exitCode).toBe(0)

    const result = await runCli(
      ['task', 'list', '--source', 'beads_sync'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('外部同步任务')
    expect(result.stdout).toContain('[beads:BEADS-801]')
  })

  it('returns structured json task list output', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()

    const result = await runCli(
      ['task', 'list', '--json'],
      { cwd: projectRoot, homeDir },
    )

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        projectRoot: string
        total: number
        items: Array<{
          title: string
        }>
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task list')
    expect(payload.data.projectRoot).toBe(projectRoot)
    expect(payload.data.total).toBe(2)
    expect(payload.data.items.map((item) => item.title)).toContain('先做 task list')
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'list', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task list')
    expect(result.stdout).toContain('fp task list')
    expect(result.stdout).toContain('--executor codex|beads|none')
    expect(result.stdout).toContain('--source manual|beads_sync|scan_suggestion')
  })

  it('localizes task list help output after language is switched', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    tempDirs.push(homeDir)

    const setLanguage = await runCli(
      ['config', 'set-language', '--lang', 'en-US'],
      { homeDir },
    )
    expect(setLanguage.exitCode).toBe(0)

    const result = await runCli(
      ['task', 'list', '--help'],
      { homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('List tasks for the current project')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(
      ['task', 'list'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('does not leak tasks from another managed project', async () => {
    const first = await createManagedProjectWithTasks()
    const second = await createManagedProjectWithTasks()

    const secondOnlyTask = await runCli(
      ['task', 'create', '--title', '只在第二项目出现'],
      { cwd: second.projectRoot, homeDir: second.homeDir },
    )
    expect(secondOnlyTask.exitCode).toBe(0)

    const result = await runCli(
      ['task', 'list'],
      { cwd: first.projectRoot, homeDir: first.homeDir },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 任务列表')

    expect(result.stdout).not.toContain('只在第二项目出现')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()

    const result = await runCli(
      ['task', 'list'],
      { cwd: projectRoot, homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
