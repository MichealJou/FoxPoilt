/**
 * @file tests/helpers/imported-beads-task.ts
 * @author michaeljou
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import Database from 'better-sqlite3'
import { expect } from 'vitest'

import { runCli } from '@tests/helpers/run-cli.js'
import { createTempDir } from '@tests/helpers/tmp-dir.js'

/**
 * 构造一个已经初始化并完成单条 Beads 任务导入的受管项目。
 *
 * 这份测试夹具专门服务于“外部任务号直连操作”测试，返回值同时包含：
 * - CLI 运行所需的 `homeDir` / `projectRoot`
 * - 导入后的内部任务 ID
 * - 对应的外部任务号
 *
 * 这样测试既可以从外部任务号入口发起命令，也能在断言数据库结果时拿到稳定的内部主键。
 */
export async function createManagedProjectWithImportedBeadsTask(input?: {
  tempDirs?: string[]
  externalTaskId?: string
  title?: string
  status?: 'ready' | 'doing' | 'blocked' | 'done'
  priority?: 'P0' | 'P1' | 'P2' | 'P3'
  repository?: string
}): Promise<{
  homeDir: string
  projectRoot: string
  taskId: string
  externalId: string
}> {
  const homeDir = await createTempDir('foxpilot-home-')
  const projectRoot = await createTempDir('foxpilot-project-')
  input?.tempDirs?.push(homeDir, projectRoot)

  await mkdir(path.join(projectRoot, '.git'), { recursive: true })

  const initResult = await runCli(
    ['init', '--path', projectRoot, '--workspace-root', path.dirname(projectRoot), '--mode', 'non-interactive'],
    { homeDir },
  )
  expect(initResult.exitCode).toBe(0)

  const externalId = input?.externalTaskId ?? 'BEADS-2001'
  const snapshotPath = path.join(projectRoot, 'beads.json')
  await writeFile(snapshotPath, `${JSON.stringify([
    {
      externalTaskId: externalId,
      title: input?.title ?? '导入任务',
      status: input?.status ?? 'ready',
      priority: input?.priority ?? 'P1',
      repository: input?.repository ?? '.',
    },
  ], null, 2)}\n`, 'utf8')

  const importResult = await runCli(
    ['task', 'import-beads', '--file', snapshotPath],
    { cwd: projectRoot, homeDir },
  )
  expect(importResult.exitCode).toBe(0)

  const db = new Database(path.join(homeDir, '.foxpilot', 'foxpilot.db'))
  const row = db.prepare(`
    SELECT id
    FROM task
    WHERE external_source = 'beads'
      AND external_id = ?
    LIMIT 1
  `).get(externalId) as { id: string }
  db.close()

  return {
    homeDir,
    projectRoot,
    taskId: row.id,
    externalId,
  }
}
