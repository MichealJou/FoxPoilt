import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

async function createManagedProjectWithRepositories(homeDir?: string): Promise<{
  homeDir: string
  projectRoot: string
}> {
  const resolvedHomeDir = homeDir ?? (await createTempDir('foxpilot-home-'))
  const projectRoot = await createTempDir('foxpilot-project-')

  if (!homeDir) {
    tempDirs.push(resolvedHomeDir)
  }

  tempDirs.push(projectRoot)

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
    { homeDir: resolvedHomeDir },
  )
  expect(initResult.exitCode).toBe(0)

  return {
    homeDir: resolvedHomeDir,
    projectRoot,
  }
}

describe('task init-beads CLI', () => {
  it('初始化单仓库的本地 Beads 环境', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const repositoryRoot = path.join(projectRoot, 'frontend')
    const calls: string[] = []

    const result = await runCli(['task', 'init-beads', '--repository', 'frontend'], {
      cwd: projectRoot,
      homeDir,
      dependencies: {
        hasLocalBeadsRepository: async () => false,
        runBdInit: async (input: { repositoryRoot: string }) => {
          calls.push(input.repositoryRoot)
        },
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已完成本地 Beads 初始化')
    expect(result.stdout).toContain('- mode: single-repository')
    expect(result.stdout).toContain('- checkedRepositories: 1')
    expect(result.stdout).toContain('- initializedRepositories: 1')
    expect(result.stdout).toContain('- skippedRepositories: 0')
    expect(result.stdout).toContain('- plannedRepositories: 1')
    expect(calls).toEqual([repositoryRoot])
  })

  it('支持 all-repositories dry-run 并跳过已初始化仓库', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    let called = false

    const result = await runCli(['task', 'init-beads', '--all-repositories', '--dry-run'], {
      cwd: projectRoot,
      homeDir,
      dependencies: {
        hasLocalBeadsRepository: async (input: { repositoryRoot: string }) =>
          input.repositoryRoot === projectRoot,
        runBdInit: async () => {
          called = true
        },
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- mode: all-repositories')
    expect(result.stdout).toContain('- dryRun: true')
    expect(result.stdout).toContain('- checkedRepositories: 2')
    expect(result.stdout).toContain('- plannedRepositories: 1')
    expect(result.stdout).toContain('- initializedRepositories: 0')
    expect(result.stdout).toContain('- skippedRepositories: 1')
    expect(called).toBe(false)
  })

  it('已初始化仓库会直接跳过', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    let called = false

    const result = await runCli(['task', 'init-beads', '--repository', 'frontend'], {
      cwd: projectRoot,
      homeDir,
      dependencies: {
        hasLocalBeadsRepository: async () => true,
        runBdInit: async () => {
          called = true
        },
      },
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('- plannedRepositories: 0')
    expect(result.stdout).toContain('- initializedRepositories: 0')
    expect(result.stdout).toContain('- skippedRepositories: 1')
    expect(called).toBe(false)
  })

  it('多仓库项目里未传 repository 或 --all-repositories 时返回错误', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(['task', 'init-beads'], { cwd: projectRoot, homeDir })

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain(
      '[FoxPilot] 本地 Beads 初始化失败: repository 或 --all-repositories 必须提供其一',
    )
  })

  it('支持帮助输出与 fp 简写入口', async () => {
    const result = await runCli(['task', 'init-beads', '--help'], { binName: 'fp' })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('fp task init-beads')
  })

  it('返回结构化 json beads 初始化结果', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'init-beads', '--repository', 'frontend', '--dry-run', '--json'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          hasLocalBeadsRepository: async () => false,
          runBdInit: async () => {
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
        dryRun: boolean
        checkedRepositories: number
        plannedRepositories: number
        initializedRepositories: number
        skippedRepositories: number
        errorRepositories: number
        results: Array<{
          repositoryPath: string
          status: string
        }>
      }
    }

    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task init-beads')
    expect(payload.data.projectRoot).toBe(projectRoot)
    expect(payload.data.mode).toBe('single-repository')
    expect(payload.data.dryRun).toBe(true)
    expect(payload.data.checkedRepositories).toBe(1)
    expect(payload.data.plannedRepositories).toBe(1)
    expect(payload.data.initializedRepositories).toBe(0)
    expect(payload.data.skippedRepositories).toBe(0)
    expect(payload.data.errorRepositories).toBe(0)
    expect(payload.data.results).toEqual([
      expect.objectContaining({
        repositoryPath: 'frontend',
        status: 'planned',
      }),
    ])
  })
})
