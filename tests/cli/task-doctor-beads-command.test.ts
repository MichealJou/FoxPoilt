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
  const resolvedHomeDir = homeDir ?? await createTempDir('foxpilot-home-')
  const projectRoot = await createTempDir('foxpilot-project-')

  if (!homeDir) {
    tempDirs.push(resolvedHomeDir)
  }

  tempDirs.push(projectRoot)

  await mkdir(path.join(projectRoot, '.git'), { recursive: true })
  await mkdir(path.join(projectRoot, 'frontend', '.git'), { recursive: true })

  const initResult = await runCli(
    ['init', '--path', projectRoot, '--workspace-root', path.dirname(projectRoot), '--mode', 'non-interactive'],
    { homeDir: resolvedHomeDir },
  )
  expect(initResult.exitCode).toBe(0)

  return {
    homeDir: resolvedHomeDir,
    projectRoot,
  }
}

describe('task doctor-beads CLI', () => {
  it('诊断单仓库的本地 Beads 环境', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()
    const repositoryRoot = path.join(projectRoot, 'frontend')

    const result = await runCli(
      ['task', 'doctor-beads', '--repository', 'frontend'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          hasLocalBeadsRepository: async (input: { repositoryRoot: string }) => {
            expect(input.repositoryRoot).toBe(repositoryRoot)
            return true
          },
          runBdList: async (input: { repositoryRoot: string }) => {
            expect(input.repositoryRoot).toBe(repositoryRoot)

            return JSON.stringify([
              { id: 'BEADS-FE-1', title: '前端任务', status: 'open', priority: 1 },
              { id: 'BEADS-FE-2', title: '联调任务', status: 'blocked', priority: 2 },
            ])
          },
        },
      },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('[FoxPilot] 已完成 Beads 环境诊断')
    expect(result.stdout).toContain('- mode: single-repository')
    expect(result.stdout).toContain('- checkedRepositories: 1')
    expect(result.stdout).toContain('- readyRepositories: 1')
    expect(result.stdout).toContain('- warningRepositories: 0')
    expect(result.stdout).toContain('- errorRepositories: 0')
    expect(result.stdout).toContain('- repository: frontend')
    expect(result.stdout).toContain('- status: ready')
    expect(result.stdout).toContain('- issueCount: 2')
  })

  it('支持按 all-repositories 诊断全部仓库并汇总 warning', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'doctor-beads', '--all-repositories'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          hasLocalBeadsRepository: async (input: { repositoryRoot: string }) => input.repositoryRoot.endsWith('/frontend'),
          runBdList: async () => JSON.stringify([
            { id: 'BEADS-FE-1', title: '前端任务', status: 'open', priority: 1 },
          ]),
        },
      },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('- mode: all-repositories')
    expect(result.stdout).toContain('- checkedRepositories: 2')
    expect(result.stdout).toContain('- readyRepositories: 1')
    expect(result.stdout).toContain('- warningRepositories: 1')
    expect(result.stdout).toContain('- errorRepositories: 0')
    expect(result.stdout).toContain('- repository: .')
    expect(result.stdout).toContain('- status: warning')
    expect(result.stdout).toContain('- repository: frontend')
    expect(result.stdout).toContain('- status: ready')
  })

  it('返回结构化 json beads 环境诊断结果', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'doctor-beads', '--all-repositories', '--json'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          hasLocalBeadsRepository: async (input: { repositoryRoot: string }) => input.repositoryRoot.endsWith('/frontend'),
          runBdList: async () => JSON.stringify([
            { id: 'BEADS-FE-1', title: '前端任务', status: 'open', priority: 1 },
          ]),
        },
      },
    )

    const payload = JSON.parse(result.stdout) as {
      ok: boolean
      command: string
      data: {
        mode: string
        checkedRepositories: number
        warningRepositories: number
        diagnoses: Array<{
          repositoryPath: string
          status: string
        }>
      }
    }

    expect(result.exitCode).toBe(1)
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('task doctor-beads')
    expect(payload.data.mode).toBe('all-repositories')
    expect(payload.data.checkedRepositories).toBe(2)
    expect(payload.data.warningRepositories).toBe(1)
    expect(payload.data.diagnoses.some((item) => item.repositoryPath === '.' && item.status === 'warning')).toBe(true)
  })

  it('仓库存在但 bd 输出非法时标记为 error', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'doctor-beads', '--repository', 'frontend'],
      {
        cwd: projectRoot,
        homeDir,
        dependencies: {
          hasLocalBeadsRepository: async () => true,
          runBdList: async () => 'not-json',
        },
      },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('- errorRepositories: 1')
    expect(result.stdout).toContain('- status: error')
    expect(result.stdout).toContain('invalid-json')
  })

  it('在多仓库项目里未传 repository 或 --all-repositories 时返回错误', async () => {
    const { homeDir, projectRoot } = await createManagedProjectWithRepositories()

    const result = await runCli(
      ['task', 'doctor-beads'],
      { cwd: projectRoot, homeDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain('[FoxPilot] Beads 环境诊断失败: repository 或 --all-repositories 必须提供其一')
  })

  it('支持帮助输出与 fp 简写入口', async () => {
    const result = await runCli(
      ['task', 'doctor-beads', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('fp task doctor-beads')
  })
})
