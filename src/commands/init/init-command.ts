/**
 * @file src/commands/init/init-command.ts
 * @author michaeljou
 */

import { access, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  GlobalConfigParseError,
  defaultGlobalConfig,
  ensureGlobalConfig,
  findMatchingWorkspaceRoot,
  type GlobalConfig,
} from '@/config/global-config.js'
import {
  createCatalogStore,
  type ProjectCatalogInput,
  type ProjectRow,
  type RepositoryRow,
  type WorkspaceRootRow,
} from '@/db/catalog-store.js'
import { bootstrapDatabase } from '@/db/bootstrap.js'
import { resolveGlobalConfigPath, resolveGlobalDatabasePath, resolveProjectConfigPath } from '@/core/paths.js'
import { isInterfaceLanguage, type InterfaceLanguage } from '@/i18n/interface-language.js'
import { getMessages, type MessageCatalog } from '@/i18n/messages.js'
import {
  ProjectAlreadyInitializedError,
  deriveProjectDisplayName,
  writeProjectConfig,
  type ProjectRepositoryConfig,
} from '@/project/project-config.js'
import { scanRepositories } from '@/project/scan-repositories.js'

import type { CliResult, InitArgs, InitCommandContext, InitCommandDependencies } from '@/commands/init/init-types.js'

/**
 * Snapshot of a file before init starts mutating local or global state.
 */
type FileSnapshot = {
  exists: boolean
  content?: string
}

/**
 * Resolves the default dependency set while allowing tests to override only
 * the collaborators they care about.
 */
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

/**
 * Restores a file to the exact pre-init state captured earlier.
 */
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

/**
 * Parses raw global config while preserving whether the language was explicitly
 * chosen by the user. Init uses that signal to decide whether it must ask.
 */
function parseStoredGlobalConfig(rawContent: string, configPath: string): {
  config: GlobalConfig
  hasStoredInterfaceLanguage: boolean
} {
  try {
    const parsed = JSON.parse(rawContent) as Partial<GlobalConfig>
    let interfaceLanguage: InterfaceLanguage = defaultGlobalConfig.interfaceLanguage
    if (parsed.interfaceLanguage && isInterfaceLanguage(parsed.interfaceLanguage)) {
      interfaceLanguage = parsed.interfaceLanguage
    }

    return {
      config: {
        ...defaultGlobalConfig,
        ...parsed,
        workspaceRoots: Array.isArray(parsed.workspaceRoots)
          ? parsed.workspaceRoots.filter((item): item is string => typeof item === 'string')
          : [],
        interfaceLanguage,
      },
      hasStoredInterfaceLanguage: isInterfaceLanguage(parsed.interfaceLanguage ?? ''),
    }
  } catch (error) {
    throw new GlobalConfigParseError(configPath, { cause: error })
  }
}

/**
 * Loads the mutable global config state together with a rollback snapshot.
 */
async function loadGlobalConfigSnapshot(homeDir: string): Promise<{
  configPath: string
  snapshot: FileSnapshot
  config: GlobalConfig
  hasStoredInterfaceLanguage: boolean
}> {
  const configPath = resolveGlobalConfigPath(homeDir)
  const snapshot = await captureFileSnapshot(configPath)

  if (!snapshot.exists) {
    return {
      configPath,
      snapshot,
      config: defaultGlobalConfig,
      hasStoredInterfaceLanguage: false,
    }
  }

  const parsedConfig = parseStoredGlobalConfig(snapshot.content ?? '', configPath)

  return {
    configPath,
    snapshot,
    config: parsedConfig.config,
    hasStoredInterfaceLanguage: parsedConfig.hasStoredInterfaceLanguage,
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

function selectInterfaceLanguage(lines: string[], stdin: string[]): InterfaceLanguage {
  lines.push(getMessages('zh-CN').init.selectInterfaceLanguage)
  lines.push(...getMessages('zh-CN').init.languageChoices)
  const answer = consumeAnswer(stdin).toLowerCase()

  if (answer === '2' || answer === 'en' || answer === 'en-us' || answer === 'english') {
    return 'en-US'
  }

  if (answer === '3' || answer === 'ja' || answer === 'ja-jp' || answer === '日本語') {
    return 'ja-JP'
  }

  return 'zh-CN'
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
  messages: MessageCatalog
  projectRoot: string
  projectName: string
  workspaceRoot: string
  repositories: ProjectRepositoryConfig[]
  projectConfigPath: string
  globalConfigPath: string
  dbPath: string
}): string {
  return [
    input.messages.init.targetConfirmed,
    `- projectRoot: ${input.projectRoot}`,
    `- projectName: ${input.projectName}`,
    `- workspaceRoot: ${input.workspaceRoot}`,
    `- repositories: ${input.repositories.length}`,
    '',
    input.messages.init.projectConfigGenerated,
    `- ${input.projectConfigPath}`,
    '',
    input.messages.init.globalConfigConfirmed,
    `- ${input.globalConfigPath}`,
    '',
    input.messages.init.globalDatabaseConfirmed,
    `- ${input.dbPath}`,
    '',
    input.messages.init.catalogWritten,
    '- workspace_root: upserted',
    '- project: upserted',
    `- repository: upserted(${input.repositories.length})`,
    '',
    input.messages.init.completed,
    input.messages.init.completedNextStep,
  ].join('\n')
}

function buildErrorOutput(title: string, detailLines: string[]): string {
  return [title, ...detailLines].join('\n')
}

async function validateProjectRoot(
  projectRoot: string,
  messages: MessageCatalog,
): Promise<CliResult | null> {
  if (!(await fileExists(projectRoot))) {
    return {
      exitCode: 1,
      stdout: buildErrorOutput(messages.init.pathNotFound, [`- path: ${projectRoot}`]),
    }
  }

  const stats = await stat(projectRoot)
  if (!stats.isDirectory()) {
    return {
      exitCode: 1,
      stdout: buildErrorOutput(messages.init.pathNotDirectory, [`- path: ${projectRoot}`]),
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
  messages: MessageCatalog
  projectRoot: string
  projectName: string
  workspaceRoot: string
  repositories: ProjectRepositoryConfig[]
}): Promise<{
  cancelled: boolean
  projectName: string
  workspaceRoot: string
}> {
  const { lines, stdin, messages, projectRoot, repositories } = input
  let { projectName, workspaceRoot } = input

  if (!promptConfirm(lines, stdin, messages.init.projectRootPrompt(projectRoot))) {
    return { cancelled: true, projectName, workspaceRoot }
  }

  if (!promptConfirm(lines, stdin, messages.init.projectNamePrompt(projectName))) {
    lines.push(messages.init.enterProjectName)
    const customProjectName = consumeAnswer(stdin)
    if (customProjectName) {
      projectName = customProjectName
    }
  }

  if (!promptConfirm(lines, stdin, messages.init.workspaceRootPrompt(workspaceRoot))) {
    lines.push(messages.init.enterWorkspaceRoot)
    const customWorkspaceRoot = consumeAnswer(stdin)
    if (customWorkspaceRoot) {
      workspaceRoot = customWorkspaceRoot
    }
  }

  lines.push(messages.init.detectedRepositories)
  repositories.forEach((repository, index) => {
    lines.push(`${index + 1}. ${repository.name} -> ${repository.path}`)
  })
  if (!promptConfirm(lines, stdin, messages.init.writeRepositoriesPrompt)) {
    return { cancelled: true, projectName, workspaceRoot }
  }

  if (!promptConfirm(lines, stdin, messages.init.continuePrompt)) {
    return { cancelled: true, projectName, workspaceRoot }
  }

  return {
    cancelled: false,
    projectName,
    workspaceRoot,
  }
}

/**
 * Rolls back global config and catalog writes when init fails after partial
 * progress. This keeps retry behavior deterministic.
 */
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

/**
 * Initializes a managed project, persists global config, boots the catalog
 * database, and writes the project manifest with rollback on failure.
 */
export async function runInitCommand(args: InitArgs, context: InitCommandContext): Promise<CliResult> {
  let messages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const projectRoot = path.resolve(context.cwd, args.path ?? '.')
  const projectConfigPath = resolveProjectConfigPath(projectRoot)
  const validationError = await validateProjectRoot(projectRoot, messages)

  if (validationError) {
    return validationError
  }

  if (await fileExists(projectConfigPath)) {
    return {
      exitCode: 2,
      stdout: buildErrorOutput(messages.init.projectConfigExists, [`- ${projectConfigPath}`]),
    }
  }

  let globalConfigState: Awaited<ReturnType<typeof loadGlobalConfigSnapshot>>
  try {
    globalConfigState = await loadGlobalConfigSnapshot(context.homeDir)
  } catch (error) {
    if (error instanceof GlobalConfigParseError) {
      return {
        exitCode: 3,
        stdout: buildErrorOutput(messages.init.malformedGlobalConfig, [
          `- ${error.configPath}`,
        ]),
      }
    }

    throw error
  }

  const lines: string[] = []
  const interactiveInput = [...context.stdin]
  let projectName = args.name ?? (path.basename(projectRoot) || 'project')
  let interfaceLanguage = globalConfigState.config.interfaceLanguage

  // The first interactive run chooses the interface language once and persists
  // it into global config for all later commands.
  if (args.mode === 'interactive' && !globalConfigState.hasStoredInterfaceLanguage) {
    interfaceLanguage = selectInterfaceLanguage(lines, interactiveInput)
    messages = getMessages(interfaceLanguage)
  } else {
    messages = getMessages(interfaceLanguage)
  }

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
      stdin: interactiveInput,
      messages,
      projectRoot,
      projectName,
      workspaceRoot,
      repositories,
    })

    if (interactiveResult.cancelled) {
      return {
        exitCode: 1,
        stdout: [...lines, messages.init.cancelled].join('\n'),
      }
    }

    projectName = interactiveResult.projectName
    workspaceRoot = path.resolve(context.cwd, interactiveResult.workspaceRoot)
  }

  if (!isWithin(workspaceRoot, projectRoot)) {
    return {
      exitCode: 1,
      stdout: buildErrorOutput(messages.init.workspaceRootMismatch, [
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
      interfaceLanguage,
    })
  } catch (error) {
    if (error instanceof GlobalConfigParseError) {
      return {
        exitCode: 3,
        stdout: buildErrorOutput(messages.init.malformedGlobalConfig, [
          `- ${error.configPath}`,
        ]),
      }
    }

    await restoreFileSnapshot(globalConfigState.configPath, globalConfigState.snapshot)
    return {
      exitCode: 1,
      stdout: messages.init.globalConfigWriteFailed,
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
      stdout: buildErrorOutput(messages.init.dbBootstrapFailed, [`- ${dbPath}`]),
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
      stdout: messages.init.catalogWriteFailed,
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
        stdout: buildErrorOutput(messages.init.projectConfigExists, [`- ${error.configPath}`]),
      }
    }

    return {
      exitCode: 1,
      stdout: messages.init.projectConfigWriteFailed,
    }
  }

  db.close()

  return {
    exitCode: 0,
    stdout: [...lines, buildSuccessOutput({
      messages,
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
