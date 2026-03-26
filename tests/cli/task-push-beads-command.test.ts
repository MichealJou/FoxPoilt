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

async function createManagedProjectWithManualTask(): Promise<{
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
    ['task', 'create', '--title', '手工任务'],
    { cwd: projectRoot, homeDir },
  )
  expect(createResult.exitCode).toBe(0)

  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  const row = db.prepare('SELECT id FROM task LIMIT 1').get() as { id: string }
  db.close()

  return {
    homeDir,
    projectRoot,
    taskId: row.id,
  }
}

describe('task push-beads CLI', () => {
  it('把已导入的 Beads 任务回写到本地 bd 仓库', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })

    expect((await runCli(
      ['task', 'edit', '--external-id', fixture.externalId, '--title', '回写后的标题', '--description', '回写后的说明'],
      { cwd: fixture.projectRoot, homeDir: fixture.homeDir },
    )).exitCode).toBe(0)

    expect((await runCli(
      ['task', 'update-priority', '--external-id', fixture.externalId, '--priority', 'P0'],
      { cwd: fixture.projectRoot, homeDir: fixture.homeDir },
    )).exitCode).toBe(0)

    expect((await runCli(
      ['task', 'update-status', '--external-id', fixture.externalId, '--status', 'analyzing'],
      { cwd: fixture.projectRoot, homeDir: fixture.homeDir },
    )).exitCode).toBe(0)

    let receivedInput: Record<string, unknown> | null = null

    const result = await runCli(
      ['task', 'push-beads', '--external-id', fixture.externalId],
      {
        cwd: fixture.projectRoot,
        homeDir: fixture.homeDir,
        dependencies: {
          hasLocalBeadsRepository: async () => true,
          runBdUpdate: async (input: Record<string, unknown>) => {
            receivedInput = input
          },
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已完成 Beads 回写')
    expect(result.stdout).toContain(`- externalId: ${fixture.externalId}`)
    expect(receivedInput).toEqual({
      repositoryRoot: fixture.projectRoot,
      externalTaskId: fixture.externalId,
      title: '回写后的标题',
      description: '回写后的说明',
      priority: 0,
      status: 'in_progress',
    })
  })

  it('支持 dry-run 且不会真正调用 bd update', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })
    let called = false

    const result = await runCli(
      ['task', 'push-beads', '--external-id', fixture.externalId, '--dry-run'],
      {
        cwd: fixture.projectRoot,
        homeDir: fixture.homeDir,
        dependencies: {
          hasLocalBeadsRepository: async () => true,
          runBdUpdate: async () => {
            called = true
          },
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- dryRun: true')
    expect(called).toBe(false)
  })

  it('拒绝回写手工创建的任务', async () => {
    const fixture = await createManagedProjectWithManualTask()

    const result = await runCli(
      ['task', 'push-beads', '--id', fixture.taskId],
      { cwd: fixture.projectRoot, homeDir: fixture.homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('任务不是 Beads 导入任务')
  })

  it('在仓库没有本地 Beads 初始化时返回错误', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })

    const result = await runCli(
      ['task', 'push-beads', '--external-id', fixture.externalId],
      {
        cwd: fixture.projectRoot,
        homeDir: fixture.homeDir,
        dependencies: {
          hasLocalBeadsRepository: async () => false,
        },
      },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('目标仓库未初始化本地 Beads')
  })

  it('支持帮助输出与 fp 简写入口', async () => {
    const result = await runCli(
      ['task', 'push-beads', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task push-beads')
    expect(result.stdout).toContain('fp task push-beads')
  })

  it('在 sqlite 初始化失败时返回 exit code 4', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })

    const result = await runCli(
      ['task', 'push-beads', '--external-id', fixture.externalId],
      { cwd: fixture.projectRoot, homeDir: fixture.homeDir, failBootstrap: true },
    )

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
