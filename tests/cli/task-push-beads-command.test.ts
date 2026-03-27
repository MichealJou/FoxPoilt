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

  const createResult = await runCli(['task', 'create', '--title', '手工任务'], {
    cwd: projectRoot,
    homeDir,
  })
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

async function createManagedProjectWithImportedBeadsTasks(): Promise<{
  homeDir: string
  projectRoot: string
}> {
  const homeDir = await createTempDir('foxpilot-home-')
  const projectRoot = await createTempDir('foxpilot-project-')
  tempDirs.push(homeDir, projectRoot)

  await mkdir(path.join(projectRoot, '.git'), { recursive: true })
  await mkdir(path.join(projectRoot, 'frontend', '.git'), { recursive: true })

  const initResult = await runCli(
    [
      'init',
      '--path',
      projectRoot,
      '--workspace-root',
      path.dirname(projectRoot),
      '--mode',
      'non-interactive',
    ],
    { homeDir },
  )
  expect(initResult.exitCode).toBe(0)

  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  db.prepare(
    `
    INSERT INTO task (
      id, project_id, title, description, source_type, status, priority, task_type,
      execution_mode, requires_plan_confirm, current_executor, external_source, external_id,
      created_at, updated_at
    ) VALUES (
      @id, @project_id, @title, @description, 'beads_sync', @status, @priority, 'generic',
      'manual', 0, 'beads', 'beads', @external_id, @created_at, @updated_at
    )
  `,
  ).run({
    id: 'task:root-1',
    project_id: `project:${projectRoot}`,
    title: '根仓库任务',
    description: '根仓库说明',
    status: 'todo',
    priority: 'P1',
    external_id: 'BEADS-ROOT-1',
    created_at: '2026-03-26T00:00:00.000Z',
    updated_at: '2026-03-26T00:00:00.000Z',
  })
  db.prepare(
    `
    INSERT INTO task (
      id, project_id, title, description, source_type, status, priority, task_type,
      execution_mode, requires_plan_confirm, current_executor, external_source, external_id,
      created_at, updated_at
    ) VALUES (
      @id, @project_id, @title, @description, 'beads_sync', @status, @priority, 'generic',
      'manual', 0, 'beads', 'beads', @external_id, @created_at, @updated_at
    )
  `,
  ).run({
    id: 'task:fe-1',
    project_id: `project:${projectRoot}`,
    title: '前端任务',
    description: '前端说明',
    status: 'executing',
    priority: 'P0',
    external_id: 'BEADS-FE-1',
    created_at: '2026-03-26T00:00:00.000Z',
    updated_at: '2026-03-26T00:00:00.000Z',
  })
  db.prepare(
    `
    INSERT INTO task_target (
      id, task_id, repository_id, target_type, target_value, created_at
    ) VALUES (
      @id, @task_id, @repository_id, 'repository', NULL, @created_at
    )
  `,
  ).run({
    id: 'task_target:root-1',
    task_id: 'task:root-1',
    repository_id: `repository:${projectRoot}:.`,
    created_at: '2026-03-26T00:00:00.000Z',
  })
  db.prepare(
    `
    INSERT INTO task_target (
      id, task_id, repository_id, target_type, target_value, created_at
    ) VALUES (
      @id, @task_id, @repository_id, 'repository', NULL, @created_at
    )
  `,
  ).run({
    id: 'task_target:fe-1',
    task_id: 'task:fe-1',
    repository_id: `repository:${projectRoot}:frontend`,
    created_at: '2026-03-26T00:00:00.000Z',
  })
  db.close()

  return {
    homeDir,
    projectRoot,
  }
}

describe('task push-beads CLI', () => {
  it('把已导入的 Beads 任务回写到本地 bd 仓库', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })

    expect(
      (
        await runCli(
          [
            'task',
            'edit',
            '--external-id',
            fixture.externalId,
            '--title',
            '回写后的标题',
            '--description',
            '回写后的说明',
          ],
          { cwd: fixture.projectRoot, homeDir: fixture.homeDir },
        )
      ).exitCode,
    ).toBe(0)

    expect(
      (
        await runCli(
          ['task', 'update-priority', '--external-id', fixture.externalId, '--priority', 'P0'],
          { cwd: fixture.projectRoot, homeDir: fixture.homeDir },
        )
      ).exitCode,
    ).toBe(0)

    expect(
      (
        await runCli(
          ['task', 'update-status', '--external-id', fixture.externalId, '--status', 'analyzing'],
          { cwd: fixture.projectRoot, homeDir: fixture.homeDir },
        )
      ).exitCode,
    ).toBe(0)

    let receivedInput: Record<string, unknown> | null = null

    const result = await runCli(['task', 'push-beads', '--external-id', fixture.externalId], {
      cwd: fixture.projectRoot,
      homeDir: fixture.homeDir,
      dependencies: {
        hasLocalBeadsRepository: async () => true,
        runBdUpdate: async (input: Record<string, unknown>) => {
          receivedInput = input
        },
      },
    })

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

  it('支持按 repository 批量回写当前仓库下的导入任务', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTasks()
    const calls: Array<Record<string, unknown>> = []

    const result = await runCli(['task', 'push-beads', '--repository', 'frontend'], {
      cwd: fixture.projectRoot,
      homeDir: fixture.homeDir,
      dependencies: {
        hasLocalBeadsRepository: async (input: { repositoryRoot: string }) =>
          input.repositoryRoot.endsWith('/frontend'),
        runBdUpdate: async (input: Record<string, unknown>) => {
          calls.push(input)
        },
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- mode: repository')
    expect(result.stdout).toContain('- repository: frontend')
    expect(result.stdout).toContain('- pushed: 1')
    expect(calls).toEqual([
      {
        repositoryRoot: path.join(fixture.projectRoot, 'frontend'),
        externalTaskId: 'BEADS-FE-1',
        title: '前端任务',
        description: '前端说明',
        priority: 0,
        status: 'in_progress',
      },
    ])
  })

  it('支持按 all-repositories 批量回写并跳过未初始化本地 Beads 的仓库', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTasks()
    const calls: Array<Record<string, unknown>> = []

    const result = await runCli(['task', 'push-beads', '--all-repositories', '--dry-run'], {
      cwd: fixture.projectRoot,
      homeDir: fixture.homeDir,
      dependencies: {
        hasLocalBeadsRepository: async (input: { repositoryRoot: string }) =>
          input.repositoryRoot.endsWith('/frontend'),
        runBdUpdate: async (input: Record<string, unknown>) => {
          calls.push(input)
        },
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- mode: all-repositories')
    expect(result.stdout).toContain('- scannedRepositories: 2')
    expect(result.stdout).toContain('- pushedRepositories: 1')
    expect(result.stdout).toContain('- skippedRepositories: 1')
    expect(result.stdout).toContain('- pushed: 1')
    expect(result.stdout).toContain('- dryRun: true')
    expect(calls).toEqual([])
  })

  it('拒绝回写手工创建的任务', async () => {
    const fixture = await createManagedProjectWithManualTask()

    const result = await runCli(['task', 'push-beads', '--id', fixture.taskId], {
      cwd: fixture.projectRoot,
      homeDir: fixture.homeDir,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('任务不是 Beads 导入任务')
  })

  it('在仓库没有本地 Beads 初始化时返回错误', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })

    const result = await runCli(['task', 'push-beads', '--external-id', fixture.externalId], {
      cwd: fixture.projectRoot,
      homeDir: fixture.homeDir,
      dependencies: {
        hasLocalBeadsRepository: async () => false,
      },
    })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('目标仓库未初始化本地 Beads')
  })

  it('在没有指定单任务或仓库范围时返回错误', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })

    const result = await runCli(['task', 'push-beads'], {
      cwd: fixture.projectRoot,
      homeDir: fixture.homeDir,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain(
      'id、external-id、repository 或 --all-repositories 必须提供其一',
    )
  })

  it('支持帮助输出与 fp 简写入口', async () => {
    const result = await runCli(['task', 'push-beads', '--help'], { binName: 'fp' })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task push-beads')
    expect(result.stdout).toContain('fp task push-beads')
  })

  it('在 sqlite 初始化失败时返回 exit code 4', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })

    const result = await runCli(['task', 'push-beads', '--external-id', fixture.externalId], {
      cwd: fixture.projectRoot,
      homeDir: fixture.homeDir,
      failBootstrap: true,
    })

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })

  it('返回结构化 json beads 回写结果', async () => {
    const fixture = await createManagedProjectWithImportedBeadsTask({ tempDirs })

    const result = await runCli(
      ['task', 'push-beads', '--external-id', fixture.externalId, '--dry-run', '--json'],
      {
        cwd: fixture.projectRoot,
        homeDir: fixture.homeDir,
        dependencies: {
          hasLocalBeadsRepository: async () => true,
          runBdUpdate: async () => {
            throw new Error('should not be called')
          },
        },
      },
    )

    expect(result.exitCode).toBe(0)

    const payload = JSON.parse(result.stdout) as {
      ok: true
      command: string
      data: {
        projectRoot: string
        mode: string
        taskId: string
        externalRef: {
          externalSource: string
          externalId: string
        }
        pushed: number
        dryRun: boolean
      }
    }

    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task push-beads')
    expect(payload.data.projectRoot).toBe(fixture.projectRoot)
    expect(payload.data.mode).toBe('single-task')
    expect(payload.data.taskId).toBe(fixture.taskId)
    expect(payload.data.externalRef).toEqual({
      externalSource: 'beads',
      externalId: fixture.externalId,
    })
    expect(payload.data.pushed).toBe(1)
    expect(payload.data.dryRun).toBe(true)
  })
})
