import { mkdir } from 'node:fs/promises'
import path from 'node:path'

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

  it('prints help and accepts fp alias', async () => {
    const result = await runCli(
      ['task', 'list', '--help'],
      { binName: 'fp' },
    )

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('foxpilot task list')
    expect(result.stdout).toContain('fp task list')
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
})
