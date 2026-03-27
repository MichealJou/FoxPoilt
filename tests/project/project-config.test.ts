import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

import type { ProjectOrchestrationConfig } from '@foxpilot/contracts/orchestration-contract.js'

type WriteProjectConfig = (input: {
  projectRoot: string
  name: string
  repositories: Array<{
    name: string
    path: string
    repoType: 'git' | 'directory' | 'subrepo'
    languageStack: string
  }>
  orchestration: ProjectOrchestrationConfig
}) => Promise<{
  configPath: string
  config: {
    name: string
    displayName: string
    rootPath: string
    version: 2
    status: 'managed'
    repositories: Array<{
      name: string
      path: string
      repoType: 'git' | 'directory' | 'subrepo'
      languageStack: string
    }>
    orchestration: ProjectOrchestrationConfig
  }
}>

const orchestrationFixture: ProjectOrchestrationConfig = {
  profile: {
    selected: 'default',
  },
  platformResolution: {
    generatedAt: '2026-03-27T00:00:00.000Z',
    stages: [
      {
        stage: 'design',
        role: 'designer',
        platform: {
          recommended: 'codex',
          effective: 'manual',
          source: 'fallback',
        },
      },
    ],
  },
}

type ErrorClass = new (...args: any[]) => Error

async function loadProjectConfigModule(): Promise<{
  writeProjectConfig: WriteProjectConfig
  ProjectAlreadyInitializedError: ErrorClass
}> {
  try {
    return await import('@foxpilot/infra/project/project-config.js')
  } catch {
    return {
      writeProjectConfig: async () => ({
        configPath: '',
        config: {
          name: '',
          displayName: '',
          rootPath: '',
          version: 2,
          status: 'managed',
          repositories: [],
          orchestration: orchestrationFixture,
        },
      }),
      ProjectAlreadyInitializedError: Error as ErrorClass,
    }
  }
}

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(removeTempDir))
})

describe('project config', () => {
  it('writes .foxpilot/project.json for the target project', async () => {
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(projectRoot)
    const { writeProjectConfig } = await loadProjectConfigModule()

    const result = await writeProjectConfig({
      projectRoot,
      name: 'foxpilot-workspace',
      repositories: [{ name: 'root', path: '.', repoType: 'directory', languageStack: '' }],
      orchestration: orchestrationFixture,
    })

    expect(result.configPath).toBe(`${projectRoot}/.foxpilot/project.json`)
    expect(result.config.version).toBe(2)
    expect(result.config.status).toBe('managed')
    expect(result.config.orchestration.profile.selected).toBe('default')
  })

  it('throws when project config already exists', async () => {
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(projectRoot)
    const { writeProjectConfig, ProjectAlreadyInitializedError } = await loadProjectConfigModule()

    await writeProjectConfig({
      projectRoot,
      name: 'foxpilot-workspace',
      repositories: [{ name: 'root', path: '.', repoType: 'directory', languageStack: '' }],
      orchestration: orchestrationFixture,
    })

    await expect(
      writeProjectConfig({
        projectRoot,
        name: 'foxpilot-workspace',
        repositories: [{ name: 'root', path: '.', repoType: 'directory', languageStack: '' }],
        orchestration: orchestrationFixture,
      }),
    ).rejects.toBeInstanceOf(ProjectAlreadyInitializedError)
  })
})
