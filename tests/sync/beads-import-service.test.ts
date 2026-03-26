import { describe, expect, it } from 'vitest'

import {
  collectDeclaredBeadsExternalTaskIds,
  decideBeadsImportAction,
  normalizeBeadsSnapshot,
} from '@/sync/beads-import-service.js'

import type { ProjectConfig } from '@/project/project-config.js'

function createProjectConfig(): ProjectConfig {
  return {
    name: 'foxpilot-workspace',
    displayName: 'Foxpilot Workspace',
    rootPath: '/workspace/foxpilot',
    status: 'managed',
    repositories: [
      {
        name: 'root',
        path: '.',
        repoType: 'git',
        languageStack: 'TypeScript',
      },
      {
        name: 'frontend',
        path: 'frontend',
        repoType: 'subrepo',
        languageStack: 'React',
      },
    ],
  }
}

describe('beads import service', () => {
  it('collects declared external ids even when records are otherwise invalid', () => {
    const result = collectDeclaredBeadsExternalTaskIds([
      {
        externalTaskId: 'BEADS-901',
        title: '合法声明',
      },
      {
        externalTaskId: ' BEADS-902 ',
        repository: 'unknown',
      },
      {
        title: '没有 externalTaskId',
      },
      null,
    ])

    expect([...result]).toEqual(['BEADS-901', 'BEADS-902'])
  })

  it('normalizes valid records and maps status and repository correctly', () => {
    const result = normalizeBeadsSnapshot({
      records: [
        {
          externalTaskId: 'BEADS-001',
          title: '接入外部导入',
          status: 'ready',
          priority: 'P1',
          repository: 'frontend',
        },
      ],
      projectRoot: '/workspace/foxpilot',
      projectConfig: createProjectConfig(),
    })

    expect(result.rejected).toEqual([])
    expect(result.accepted).toEqual([
      {
        externalTaskId: 'BEADS-001',
        title: '接入外部导入',
        status: 'todo',
        priority: 'P1',
        repositoryId: 'repository:/workspace/foxpilot:frontend',
      },
    ])
  })

  it('collects rejected reasons without aborting the whole batch', () => {
    const result = normalizeBeadsSnapshot({
      records: [
        {
          externalTaskId: 'BEADS-001',
          title: '合法任务',
          status: 'doing',
          priority: 'P2',
          repository: '.',
        },
        {
          externalTaskId: 'BEADS-001',
          title: '重复外部任务',
          status: 'doing',
          priority: 'P2',
          repository: '.',
        },
        {
          externalTaskId: 'BEADS-003',
          title: '仓库不存在',
          status: 'ready',
          priority: 'P2',
          repository: 'unknown',
        },
      ],
      projectRoot: '/workspace/foxpilot',
      projectConfig: createProjectConfig(),
    })

    expect(result.accepted).toHaveLength(1)
    expect(result.rejected).toEqual([
      'record[1]: externalTaskId 重复',
      'record[2]: repository 不存在 (unknown)',
    ])
  })

  it('decides create when no existing task is found', () => {
    const action = decideBeadsImportAction(null, {
      externalTaskId: 'BEADS-101',
      title: '创建新任务',
      status: 'todo',
      priority: 'P2',
      repositoryId: 'repository:/workspace/foxpilot:.',
    })

    expect(action).toBe('create')
  })

  it('decides skip when the snapshot is fully unchanged', () => {
    const action = decideBeadsImportAction(
      {
        id: 'task:beads-1',
        title: '保持不变',
        status: 'executing',
        priority: 'P1',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'beads',
        external_source: 'beads',
        external_id: 'BEADS-201',
        repository_id: 'repository:/workspace/foxpilot:frontend',
      },
      {
        externalTaskId: 'BEADS-201',
        title: '保持不变',
        status: 'executing',
        priority: 'P1',
        repositoryId: 'repository:/workspace/foxpilot:frontend',
      },
    )

    expect(action).toBe('skip')
  })

  it('decides update when title or target repository changes', () => {
    const action = decideBeadsImportAction(
      {
        id: 'task:beads-2',
        title: '旧标题',
        status: 'todo',
        priority: 'P2',
        task_type: 'generic',
        execution_mode: 'manual',
        requires_plan_confirm: 1,
        current_executor: 'beads',
        external_source: 'beads',
        external_id: 'BEADS-202',
        repository_id: 'repository:/workspace/foxpilot:.',
      },
      {
        externalTaskId: 'BEADS-202',
        title: '新标题',
        status: 'todo',
        priority: 'P2',
        repositoryId: 'repository:/workspace/foxpilot:frontend',
      },
    )

    expect(action).toBe('update')
  })
})
