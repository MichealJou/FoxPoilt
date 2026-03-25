import { access, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  GlobalConfigParseError,
  defaultGlobalConfig,
  ensureGlobalConfig,
  findMatchingWorkspaceRoot,
  type GlobalConfig,
} from '../../config/global-config.js'
import {
  createCatalogStore,
  type ProjectCatalogInput,
  type ProjectRow,
  type RepositoryRow,
  type WorkspaceRootRow,
} from '../../db/catalog-store.js'
import { bootstrapDatabase } from '../../db/bootstrap.js'
import { resolveGlobalConfigPath, resolveGlobalDatabasePath, resolveProjectConfigPath } from '../../core/paths.js'
import {
  ProjectAlreadyInitializedError,
  deriveProjectDisplayName,
  writeProjectConfig,
  type ProjectRepositoryConfig,
} from '../../project/project-config.js'
import { scanRepositories } from '../../project/scan-repositories.js'

import type { CliResult, InitArgs, InitCommandContext, InitCommandDependencies } from './init-types.js'

type FileSnapshot = {
  exists: boolean
  content?: string
}

function getDependencies(
  overrides: Partial<InitCommandDependencies> = {},
): InitCommandDependencies {
  return {
    ensureGlobalConfig,
    scanRepositories,
    bootstrapDatabase,
    createCatalogStore,
    writeProjectConfig,
    ...overrides,
  }
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function captureFileSnapshot(targetPath: string): Promise<FileSnapshot> {
  try {
    const content = await readFile(targetPath, 'utf8')
    return { exists: true, content }
  } catch {
    return { exists: false }
  }
}

async function restoreFileSnapshot(targetPath: string, snapshot: FileSnapshot): Promise<void> {
  if (!snapshot.exists) {
    await rm(targetPath, { force: true })
    return
  }

  await writeFile(targetPath, snapshot.content ?? '', 'utf8')
}

function isWithin(rootPath: string, targetPath: string): boolean {
  const relative = path.relative(path.resolve(rootPath), path.resolve(targetPath))
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

function buildWorkspaceRootName(workspaceRoot: string): string {
  return path.basename(workspaceRoot) || workspaceRoot
}

function createWorkspaceRootRow(workspaceRoot: string, now: string): WorkspaceRootRow {
  return {
    id: `workspace_root:${workspaceRoot}`,
    name: buildWorkspaceRootName(workspaceRoot),
    path: workspaceRoot,
    enabled: 1,
    description: null,
    created_at: now,
    updated_at: now,
  }
}

function createProjectRow(projectRoot: string, workspaceRoot: string, name: string, now: string): ProjectRow {
  return {
    id: `project:${projectRoot}`,
    workspace_root_id: `workspace_root:${workspaceRoot}`,
    name,
    display_name: deriveProjectDisplayName(name),
    root_path: projectRoot,
    source_type: 'manual',
    status: 'managed',
    description: null,
    created_at: now,
    updated_at: now,
  }
}

function createRepositoryRows(
  projectRoot: string,
  repositories: ProjectRepositoryConfig[],
  now: string,
): RepositoryRow[] {
  return repositories.map((repository) => ({
    id: `repository:${projectRoot}:${repository.path}`,
    project_id: `project:${projectRoot}`,
    name: repository.name,
    display_name: deriveProjectDisplayName(repository.name),
    path: repository.path,
    repo_type: repository.repoType,
    language_stack: repository.languageStack,
    enabled: 1,
    created_at: now,
    updated_at: now,
  }))
}

function parseStoredGlobalConfig(rawContent: string, configPath: string): GlobalConfig {
  try {
    const parsed = JSON.parse(rawContent) as Partial<GlobalConfig>
    return {
      ...defaultGlobalConfig,
      ...parsed,
      workspaceRoots: Array.isArray(parsed.workspaceRoots)
        ? parsed.workspaceRoots.filter((item): item is string => typeof item === 'string')
        : [],
    }
  } catch (error) {
    throw new GlobalConfigParseError(configPath, { cause: error })
  }
}

async function loadGlobalConfigSnapshot(homeDir: string): Promise<{
  configPath: string
  snapshot: FileSnapshot
  config: GlobalConfig
}> {
  const configPath = resolveGlobalConfigPath(homeDir)
  const snapshot = await captureFileSnapshot(configPath)

  if (!snapshot.exists) {
    return {
      configPath,
      snapshot,
      config: defaultGlobalConfig,
    }
  }

  return {
    configPath,
    snapshot,
    config: parseStoredGlobalConfig(snapshot.content ?? '', configPath),
  }
}

function consumeAnswer(stdin: string[]): string {
  return (stdin.shift() ?? '').trim()
}

function isAffirmative(answer: string): boolean {
  const normalized = answer.trim().toLowerCase()
  return normalized === '' || normalized === 'y' || normalized === 'yes'
}

function promptConfirm(lines: string[], stdin: string[], ...promptLines: string[]): boolean {
  lines.push(...promptLines)
  return isAffirmative(consumeAnswer(stdin))
}

function buildHelpText(): string {
  return [
    'foxpilot init',
    'fp init',
    '--path <project-root>',
    '--name <project-name>',
    '--workspace-root <workspace-root>',
    '--mode interactive|non-interactive',
    '--no-scan',
  ].join('\n')
}

function buildSuccessOutput(input: {
  projectRoot: string
  projectName: string
  workspaceRoot: string
  repositories: ProjectRepositoryConfig[]
  projectConfigPath: string
  globalConfigPath: string
  dbPath: string
}): string {
  return [
    '[FoxPilot] 初始化目标已确认',
    `- projectRoot: ${input.projectRoot}`,
    `- projectName: ${input.projectName}`,
    `- workspaceRoot: ${input.workspaceRoot}`,
    `- repositories: ${input.repositories.length}`,
    '',
    '[FoxPilot] 已生成项目配置',
    `- ${input.projectConfigPath}`,
    '',
    '[FoxPilot] 已确认全局配置',
    `- ${input.globalConfigPath}`,
    '',
    '[FoxPilot] 已确认全局数据库',
    `- ${input.dbPath}`,
    '',
    '[FoxPilot] 已写入项目索引',
    '- workspace_root: upserted',
    '- project: upserted',
    `- repository: upserted(${input.repositories.length})`,
    '',
    '[FoxPilot] 初始化完成',
    '后续可继续执行任务登记、项目扫描建议或桌面端接管流程。',
  ].join('\n')
}

function buildErrorOutput(title: string, detailLines: string[]): string {
  return [title, ...detailLines].join('\n')
}

async function validateProjectRoot(projectRoot: string): Promise<CliResult | null> {
  if (!(await fileExists(projectRoot))) {
    return {
      exitCode: 1,
      stdout: buildErrorOutput('[FoxPilot] 初始化失败: 目标路径不存在', [`- path: ${projectRoot}`]),
    }
  }

  const stats = await stat(projectRoot)
  if (!stats.isDirectory()) {
    return {
      exitCode: 1,
      stdout: buildErrorOutput('[FoxPilot] 初始化失败: 目标路径不是目录', [`- path: ${projectRoot}`]),
    }
  }

  return null
}

function resolveWorkspaceRoot(input: {
  explicitWorkspaceRoot?: string
  cwd: string
  projectRoot: string
  existingWorkspaceRoots: string[]
}): string {
  if (input.explicitWorkspaceRoot) {
    return path.resolve(input.cwd, input.explicitWorkspaceRoot)
  }

  return (
    findMatchingWorkspaceRoot(input.projectRoot, input.existingWorkspaceRoots) ??
    path.dirname(input.projectRoot)
  )
}

async function runInteractivePrompts(input: {
  lines: string[]
  stdin: string[]
  projectRoot: string
  projectName: string
  workspaceRoot: string
  repositories: ProjectRepositoryConfig[]
}): Promise<{
  cancelled: boolean
  projectName: string
  workspaceRoot: string
}> {
  const { lines, stdin, projectRoot, repositories } = input
  let { projectName, workspaceRoot } = input

  if (!promptConfirm(lines, stdin, `项目根目录: ${projectRoot}`, '是否使用这个目录初始化？ [Y/n]')) {
    return { cancelled: true, projectName, workspaceRoot }
  }

  if (!promptConfirm(lines, stdin, `项目名默认为 ${projectName}，是否确认？ [Y/n]`)) {
    lines.push('请输入项目名:')
    const customProjectName = consumeAnswer(stdin)
    if (customProjectName) {
      projectName = customProjectName
    }
  }

  if (!promptConfirm(lines, stdin, `推断工作区根目录为 ${workspaceRoot}，是否确认？ [Y/n]`)) {
    lines.push('请输入工作区根目录:')
    const customWorkspaceRoot = consumeAnswer(stdin)
    if (customWorkspaceRoot) {
      workspaceRoot = customWorkspaceRoot
    }
  }

  lines.push('识别到以下仓库候选:')
  repositories.forEach((repository, index) => {
    lines.push(`${index + 1}. ${repository.name} -> ${repository.path}`)
  })
  if (!promptConfirm(lines, stdin, '是否按该结果写入？ [Y/n]')) {
    return { cancelled: true, projectName, workspaceRoot }
  }

  if (!promptConfirm(lines, stdin, '将生成项目配置并写入全局索引，是否继续？ [Y/n]')) {
    return { cancelled: true, projectName, workspaceRoot }
  }

  return {
    cancelled: false,
    projectName,
    workspaceRoot,
  }
}

async function cleanupAfterFailure(input: {
  globalConfigPath: string
  globalConfigSnapshot: FileSnapshot
  dbPath: string
  store?: ReturnType<typeof createCatalogStore>
  projectRoot: string
  workspaceRoot: string
}): Promise<void> {
  await restoreFileSnapshot(input.globalConfigPath, input.globalConfigSnapshot)

  if (input.store) {
    input.store.deleteProjectCatalog(`project:${input.projectRoot}`, `workspace_root:${input.workspaceRoot}`)
  }
}

export async function runInitCommand(args: InitArgs, context: InitCommandContext): Promise<CliResult> {
  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const projectRoot = path.resolve(context.cwd, args.path ?? '.')
  const projectConfigPath = resolveProjectConfigPath(projectRoot)
  const validationError = await validateProjectRoot(projectRoot)

  if (validationError) {
    return validationError
  }

  if (await fileExists(projectConfigPath)) {
    return {
      exitCode: 2,
      stdout: buildErrorOutput('[FoxPilot] 初始化中止: 项目已存在配置', [`- ${projectConfigPath}`]),
    }
  }

  let globalConfigState: Awaited<ReturnType<typeof loadGlobalConfigSnapshot>>
  try {
    globalConfigState = await loadGlobalConfigSnapshot(context.homeDir)
  } catch (error) {
    if (error instanceof GlobalConfigParseError) {
      return {
        exitCode: 3,
        stdout: buildErrorOutput('[FoxPilot] 初始化失败: foxpilot.config.json 格式错误', [
          `- ${error.configPath}`,
        ]),
      }
    }

    throw error
  }

  const lines: string[] = []
  let projectName = args.name ?? (path.basename(projectRoot) || 'project')
  let workspaceRoot = resolveWorkspaceRoot({
    explicitWorkspaceRoot: args.workspaceRoot,
    cwd: context.cwd,
    projectRoot,
    existingWorkspaceRoots: globalConfigState.config.workspaceRoots,
  })
  let repositories = await dependencies.scanRepositories(projectRoot, { noScan: args.noScan })

  if (args.mode === 'interactive') {
    const interactiveResult = await runInteractivePrompts({
      lines,
      stdin: [...context.stdin],
      projectRoot,
      projectName,
      workspaceRoot,
      repositories,
    })

    if (interactiveResult.cancelled) {
      return {
        exitCode: 1,
        stdout: [...lines, '[FoxPilot] 初始化已取消'].join('\n'),
      }
    }

    projectName = interactiveResult.projectName
    workspaceRoot = path.resolve(context.cwd, interactiveResult.workspaceRoot)
  }

  if (!isWithin(workspaceRoot, projectRoot)) {
    return {
      exitCode: 1,
      stdout: buildErrorOutput('[FoxPilot] 初始化失败: workspace root 不包含项目路径', [
        `- workspaceRoot: ${workspaceRoot}`,
        `- projectRoot: ${projectRoot}`,
      ]),
    }
  }

  let ensureResult: Awaited<ReturnType<typeof ensureGlobalConfig>>
  try {
    ensureResult = await dependencies.ensureGlobalConfig({
      homeDir: context.homeDir,
      workspaceRoot,
    })
  } catch (error) {
    if (error instanceof GlobalConfigParseError) {
      return {
        exitCode: 3,
        stdout: buildErrorOutput('[FoxPilot] 初始化失败: foxpilot.config.json 格式错误', [
          `- ${error.configPath}`,
        ]),
      }
    }

    await restoreFileSnapshot(globalConfigState.configPath, globalConfigState.snapshot)
    return {
      exitCode: 1,
      stdout: '[FoxPilot] 初始化失败: 全局配置写入失败',
    }
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  const dbSnapshot = await captureFileSnapshot(dbPath)

  let db: Awaited<ReturnType<typeof bootstrapDatabase>> | undefined
  try {
    db = await dependencies.bootstrapDatabase(dbPath)
  } catch {
    await restoreFileSnapshot(globalConfigState.configPath, globalConfigState.snapshot)
    if (!dbSnapshot.exists) {
      await rm(dbPath, { force: true })
    }
    return {
      exitCode: 4,
      stdout: buildErrorOutput('[FoxPilot] 初始化失败: foxpilot.db 初始化失败', [`- ${dbPath}`]),
    }
  }

  const store = dependencies.createCatalogStore(db)
  const now = new Date().toISOString()
  const catalogInput: ProjectCatalogInput = {
    workspaceRoot: createWorkspaceRootRow(workspaceRoot, now),
    project: createProjectRow(projectRoot, workspaceRoot, projectName, now),
    repositories: createRepositoryRows(projectRoot, repositories, now),
  }

  try {
    store.upsertProjectCatalog(catalogInput)
  } catch {
    db.close()
    await cleanupAfterFailure({
      globalConfigPath: globalConfigState.configPath,
      globalConfigSnapshot: globalConfigState.snapshot,
      dbPath,
      projectRoot,
      workspaceRoot,
    })
    return {
      exitCode: 1,
      stdout: '[FoxPilot] 初始化失败: 项目索引写入失败',
    }
  }

  try {
    await dependencies.writeProjectConfig({
      projectRoot,
      name: projectName,
      repositories,
    })
  } catch (error) {
    await cleanupAfterFailure({
      globalConfigPath: globalConfigState.configPath,
      globalConfigSnapshot: globalConfigState.snapshot,
      dbPath,
      store,
      projectRoot,
      workspaceRoot,
    })
    db.close()

    if (error instanceof ProjectAlreadyInitializedError) {
      return {
        exitCode: 2,
        stdout: buildErrorOutput('[FoxPilot] 初始化中止: 项目已存在配置', [`- ${error.configPath}`]),
      }
    }

    return {
      exitCode: 1,
      stdout: '[FoxPilot] 初始化失败: 项目配置写入失败',
    }
  }

  db.close()

  return {
    exitCode: 0,
    stdout: [...lines, buildSuccessOutput({
      projectRoot,
      projectName,
      workspaceRoot,
      repositories,
      projectConfigPath,
      globalConfigPath: ensureResult.configPath,
      dbPath,
    })].filter(Boolean).join('\n'),
  }
}
