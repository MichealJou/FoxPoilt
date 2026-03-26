import os from 'node:os'

type RunCliOptions = {
  binName?: 'foxpilot' | 'fp'
  cwd?: string
  homeDir?: string
  executablePath?: string
  stdin?: string[]
  dependencies?: Record<string, unknown>
  failEnsureGlobalConfig?: boolean
  failBootstrap?: boolean
  failUpsert?: boolean
  failWriteProjectConfig?: boolean
}

export async function runCli(argv: string[], options: RunCliOptions = {}) {
  const { main } = await import('@/cli/main.js')
  const globalConfigModule = await import('@/config/global-config.js')
  const bootstrapModule = await import('@/db/bootstrap.js')
  const catalogStoreModule = await import('@/db/catalog-store.js')
  const projectConfigModule = await import('@/project/project-config.js')

  const dependencies: Record<string, unknown> = {
    ensureGlobalConfig: globalConfigModule.ensureGlobalConfig,
    bootstrapDatabase: bootstrapModule.bootstrapDatabase,
    createCatalogStore: catalogStoreModule.createCatalogStore,
    writeProjectConfig: projectConfigModule.writeProjectConfig,
    ...(options.dependencies ?? {}),
  }

  if (options.failEnsureGlobalConfig) {
    dependencies.ensureGlobalConfig = async () => {
      throw new Error('Injected ensureGlobalConfig failure')
    }
  }

  if (options.failBootstrap) {
    dependencies.bootstrapDatabase = async () => {
      throw new Error('Injected bootstrap failure')
    }
  }

  if (options.failUpsert) {
    dependencies.createCatalogStore = (db: unknown) => {
      const store = catalogStoreModule.createCatalogStore(db as never)
      return {
        ...store,
        upsertProjectCatalog: () => {
          throw new Error('Injected upsert failure')
        },
      }
    }
  }

  if (options.failWriteProjectConfig) {
    dependencies.writeProjectConfig = async () => {
      throw new Error('Injected writeProjectConfig failure')
    }
  }

  return main(argv, {
    binName: options.binName ?? 'foxpilot',
    cwd: options.cwd ?? process.cwd(),
    homeDir: options.homeDir ?? os.homedir(),
    executablePath: options.executablePath,
    stdin: [...(options.stdin ?? [])],
    dependencies,
  })
}
