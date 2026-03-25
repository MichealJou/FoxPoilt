import { afterEach, describe, expect, it } from 'vitest'

import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

type WriteProjectConfig = (input: {
  projectRoot: string
  name: string
  repositories: Array<{
    name: string
    path: string
    repoType: 'git' | 'directory' | 'subrepo'
    languageStack: string
  }>
}) => Promise<{
  configPath: string
  config: {
    name: string
    displayName: string
    rootPath: string
    status: 'managed'
    repositories: Array<{
      name: string
      path: string
      repoType: 'git' | 'directory' | 'subrepo'
      languageStack: string
    }>
  }
}>

type ErrorClass = new (...args: any[]) => Error

async function loadProjectConfigModule(): Promise<{
  writeProjectConfig: WriteProjectConfig
  ProjectAlreadyInitializedError: ErrorClass
}> {
  try {
    return await import('@/project/project-config.js')
  } catch {
    return {
      writeProjectConfig: async () => ({
        configPath: '',
        config: {
          name: '',
          displayName: '',
          rootPath: '',
          status: 'managed',
          repositories: [],
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
    })

    expect(result.configPath).toBe(`${projectRoot}/.foxpilot/project.json`)
    expect(result.config.status).toBe('managed')
  })

  it('throws when project config already exists', async () => {
    const projectRoot = await createTempDir('foxpilot-project-')
    tempDirs.push(projectRoot)
    const { writeProjectConfig, ProjectAlreadyInitializedError } = await loadProjectConfigModule()

    await writeProjectConfig({
      projectRoot,
      name: 'foxpilot-workspace',
      repositories: [{ name: 'root', path: '.', repoType: 'directory', languageStack: '' }],
    })

    await expect(
      writeProjectConfig({
        projectRoot,
        name: 'foxpilot-workspace',
        repositories: [{ name: 'root', path: '.', repoType: 'directory', languageStack: '' }],
      }),
    ).rejects.toBeInstanceOf(ProjectAlreadyInitializedError)
  })
})
