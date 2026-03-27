import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

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

  const snapshotPath = path.join(projectRoot, 'beads.json')
  await writeFile(
    snapshotPath,
    `${JSON.stringify(
      [
        {
          externalTaskId: 'BEADS-1101',
          title: '主仓待办',
          status: 'ready',
          priority: 'P1',
          repository: '.',
        },
        {
          externalTaskId: 'BEADS-1102',
          title: '前端执行中',
          status: 'doing',
          priority: 'P2',
          repository: 'frontend',
        },
        {
          externalTaskId: 'BEADS-1103',
          title: '主仓阻塞',
          status: 'blocked',
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

  return {
    homeDir,
    projectRoot,
  }
}

describe('task beads-summary CLI', () => {
  it('shows aggregated summary for imported beads tasks in the current project', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithImportedBeadsTasks()

    const result = await runCli(['task', 'beads-summary'], { cwd: projectRoot, homeDir })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] Beads 任务摘要')
    expect(result.stdout).toContain('- total: 3')
    expect(result.stdout).toContain('- repositories: 2')
    expect(result.stdout).toContain('- todo: 1')
    expect(result.stdout).toContain('- executing: 1')
    expect(result.stdout).toContain('- blocked: 1')
    expect(result.stdout).toContain('- done: 0')
  })

  it('shows an empty summary when the current project has no imported beads tasks', async () => {
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

    const result = await runCli(['task', 'beads-summary'], { cwd: projectRoot, homeDir })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 当前项目没有 Beads 同步任务')
  })

  it('returns structured json beads summary output', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithImportedBeadsTasks()

    const result = await runCli(['task', 'beads-summary', '--json'], { cwd: projectRoot, homeDir })

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        projectRoot: string
        summary: {
          total: number
          repositories: number
          blocked: number
        }
      }
    }

    expect(result.exitCode).toBe(0)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task beads-summary')
    expect(payload.data.projectRoot).toBe(projectRoot)
    expect(payload.data.summary.total).toBe(3)
    expect(payload.data.summary.repositories).toBe(2)
    expect(payload.data.summary.blocked).toBe(1)
  })

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(['task', 'beads-summary', '--help'], { binName: 'fp' })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task beads-summary')
    expect(result.stdout).toContain('fp task beads-summary')
  })

  it('returns a clear error when the project is not initialized', async () => {
    const homeDir = await createTempDir('foxpilot-home-')
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(homeDir, projectRoot)

    const result = await runCli(['task', 'beads-summary'], { cwd: projectRoot, homeDir })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('项目尚未初始化')
  })

  it('returns exit code 4 when sqlite bootstrap fails', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithImportedBeadsTasks()

    const result = await runCli(['task', 'beads-summary'], {
      cwd: projectRoot,
      homeDir,
      failBootstrap: true,
    })

    expect(result.exitCode).toBe(4)
    expect(result.stdout).toContain('foxpilot.db 初始化失败')
  })
})
