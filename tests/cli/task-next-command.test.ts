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

  const firstTask = await runCli(['task', 'create', '--title', '先补任务列表过滤'], {
    cwd: projectRoot,
    homeDir,
  })
  expect(firstTask.exitCode).toBe(0)

  const secondTask = await runCli(['task', 'create', '--title', '继续补任务状态流转'], {
    cwd: projectRoot,
    homeDir,
  })
  expect(secondTask.exitCode).toBe(0)

  return { homeDir, projectRoot }
}

function getTaskRows(homeDir: string): Array<{
  id: string
  title: string
}> {
  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  const rows = db.prepare('SELECT id, title FROM task ORDER BY created_at ASC').all() as Array<{
    id: string
    title: string
  }>
  db.close()
  return rows
}

describe('task next CLI', () => {
  it('returns the highest ranked actionable task in the current project', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()
    const rows = getTaskRows(homeDir)
    const secondTask = rows.find((row) => row.title === '继续补任务状态流转')
    expect(secondTask).toBeDefined()

    const updateStatus = await runCli(
      ['task', 'update-status', '--id', secondTask!.id, '--status', 'analyzing'],
      { cwd: projectRoot, homeDir },
    )
    expect(updateStatus.exitCode).toBe(0)

    const result = await runCli(['task', 'next'], { cwd: projectRoot, homeDir })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 下一条任务')
    expect(result.stdout).toContain(`taskId: ${secondTask!.id}`)
    expect(result.stdout).toContain('title: 继续补任务状态流转')
    expect(result.stdout).toContain('status: analyzing')
  })

  it('supports filtering by executor', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()
    const rows = getTaskRows(homeDir)
    const firstTask = rows.find((row) => row.title === '先补任务列表过滤')
    expect(firstTask).toBeDefined()

    const updateExecutor = await runCli(
      ['task', 'update-executor', '--id', firstTask!.id, '--executor', 'beads'],
      { cwd: projectRoot, homeDir },
    )
    expect(updateExecutor.exitCode).toBe(0)

    const result = await runCli(['task', 'next', '--executor', 'beads'], {
      cwd: projectRoot,
      homeDir,
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain(`taskId: ${firstTask!.id}`)
    expect(result.stdout).toContain('executor: beads')
    expect(result.stdout).not.toContain('继续补任务状态流转')
  })

  it('supports filtering by source', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()

    const suggestScan = await runCli(['task', 'suggest-scan'], { cwd: projectRoot, homeDir })
    expect(suggestScan.exitCode).toBe(0)

    const result = await runCli(['task', 'next', '--source', 'scan_suggestion'], {
      cwd: projectRoot,
      homeDir,
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('source: scan_suggestion')
    expect(result.stdout).toContain('扫描建议')
  })

  it('shows external reference fields for imported beads tasks', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()
    const snapshotPath = path.join(projectRoot, 'beads.json')

    await writeFile(
      snapshotPath,
      `${JSON.stringify(
        [
          {
            externalTaskId: 'BEADS-901',
            title: '下一条外部任务',
            status: 'doing',
            priority: 'P0',
            repository: '.',
          },
        ],
        null,
        2,
      )}\n`,
      'utf8',
    )

    const importResult = await runCli(['task', 'import-beads', '--file', snapshotPath], {
      cwd: projectRoot,
      homeDir,
    })
    expect(importResult.exitCode).toBe(0)

    const result = await runCli(['task', 'next', '--source', 'beads_sync'], {
      cwd: projectRoot,
      homeDir,
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('title: 下一条外部任务')
    expect(result.stdout).toContain('externalSource: beads')
    expect(result.stdout).toContain('externalId: BEADS-901')
  })

  it('returns structured json next-task output', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()
    const rows = getTaskRows(homeDir)
    const secondTask = rows.find((row) => row.title === '继续补任务状态流转')
    expect(secondTask).toBeDefined()

    await runCli(['task', 'update-status', '--id', secondTask!.id, '--status', 'analyzing'], {
      cwd: projectRoot,
      homeDir,
    })

    const result = await runCli(['task', 'next', '--json'], { cwd: projectRoot, homeDir })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        item: {
          taskId: string
          title: string
          status: string
        } | null
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task next')
    expect(payload.data.item?.taskId).toBe(secondTask!.id)
    expect(payload.data.item?.status).toBe('analyzing')
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(['task', 'next', '--help'], { binName: 'fp' })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task next')
    expect(result.stdout).toContain('fp task next')
    expect(result.stdout).toContain('--executor codex|beads|none')
    expect(result.stdout).toContain('--source manual|beads_sync|scan_suggestion')
  })

  it('localizes task next help output after language is switched', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    tempDirs.push(homeDir)

    const setLanguage = await runCli(['config', 'set-language', '--lang', 'en-US'], { homeDir })
    expect(setLanguage.exitCode).toBe(0)

    const result = await runCli(['task', 'next', '--help'], { homeDir })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Show the next actionable task')
  })

  it('returns an empty message when there is no actionable task', async () => {
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

    const result = await runCli(['task', 'next'], { cwd: projectRoot, homeDir })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 当前没有可推进任务')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(['task', 'next'], { cwd: projectRoot, homeDir })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithTasks()

    const result = await runCli(['task', 'next'], {
      cwd: projectRoot,
      homeDir,
      failBootstrap: true,
    })

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
