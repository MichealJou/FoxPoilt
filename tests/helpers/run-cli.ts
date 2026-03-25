import os from 'node:os'

type RunCliOptions = {
  binName?: 'foxpilot' | 'fp'
  cwd?: string
  homeDir?: string
  stdin?: string[]
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

  const dependencies: Record<string, unknown> = {}

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

  if (Object.keys(dependencies).length === 0) {
    dependencies.ensureGlobalConfig = globalConfigModule.ensureGlobalConfig
    dependencies.bootstrapDatabase = bootstrapModule.bootstrapDatabase
    dependencies.createCatalogStore = catalogStoreModule.createCatalogStore
    dependencies.writeProjectConfig = projectConfigModule.writeProjectConfig
  }

  return main(argv, {
    binName: options.binName ?? 'foxpilot',
    cwd: options.cwd ?? process.cwd(),
    homeDir: options.homeDir ?? os.homedir(),
    stdin: [...(options.stdin ?? [])],
    dependencies,
  })
}
