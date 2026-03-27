/**
 * @file src/commands/init/init-command.ts
 * @author michaeljou
 */

import { access, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import {
  GlobalConfigParseError,
  defaultGlobalConfig,
  ensureGlobalConfig,
  findMatchingWorkspaceRoot,
  type GlobalConfig,
} from '@foxpilot/infra/config/global-config.js'
import {
  createCatalogStore,
  type ProjectCatalogInput,
  type ProjectRow,
  type RepositoryRow,
  type WorkspaceRootRow,
} from '@foxpilot/infra/db/catalog-store.js'
import { bootstrapDatabase } from '@foxpilot/infra/db/bootstrap.js'
import { resolveGlobalConfigPath, resolveGlobalDatabasePath, resolveProjectConfigPath } from '@foxpilot/infra/core/paths.js'
import { isInterfaceLanguage, type InterfaceLanguage } from '@/i18n/interface-language.js'
import { getMessages, type MessageCatalog } from '@/i18n/messages.js'
import {
  ProjectAlreadyInitializedError,
  deriveProjectDisplayName,
  writeProjectConfig,
  type ProjectRepositoryConfig,
} from '@foxpilot/infra/project/project-config.js'
import { scanRepositories } from '@foxpilot/infra/project/scan-repositories.js'
import { resolveProjectPlatformResolution } from '@foxpilot/runtime/orchestrators/platform-resolver.js'
import { resolveProjectProfileId } from '@/commands/init/init-profile.js'
import { collectProjectScanSignals } from '@foxpilot/runtime/init/project-scan-signals.js'
import { createInitRecommendation } from '@foxpilot/runtime/init/init-recommendation-engine.js'

import type {
  CliResult,
  InitArgs,
  InitCommandContext,
  InitCommandDependencies,
  InitPreviewResult,
} from '@/commands/init/init-types.js'

/**
 * 记录 init 开始修改本地或全局状态之前的文件快照。
 *
 * 这类快照用于补偿和回滚，确保初始化在失败时不会留下半成品状态。
 */
type FileSnapshot = {
  /** 目标文件在快照采集时是否存在。 */
  exists: boolean
  /** 文件存在时的原始文本内容。 */
  content?: string
}

/**
 * 解析默认依赖集合，同时允许测试只覆盖自己关心的依赖。
 *
 * 设计逻辑：
 * 1. 业务逻辑默认走真实依赖。
 * 2. 测试只替换局部依赖，避免每个用例都重新手工拼整套上下文。
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
    resolvePlatformResolution: resolveProjectPlatformResolution,
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
 * 将文件恢复到 init 之前记录的精确状态。
 *
 * 如果文件原本不存在，就直接删除；如果原本存在，就恢复原始文本内容。
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

/**
 * 构造 `workspace_root` 表记录。
 *
 * 设计逻辑：
 * 1. 工作区主键直接绑定绝对路径，避免额外的映射表。
 * 2. 显示名只做轻量推断，不在初始化阶段引入复杂命名规则。
 */
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

/**
 * 构造 `project` 表记录。
 *
 * 项目记录表达的是“这个项目已经被手动初始化并受 FoxPilot 管理”。
 */
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

/**
 * 将项目配置中的仓库列表转换成全局索引表记录。
 *
 * 仓库主键显式携带项目根路径，保证不同项目下同名仓库不会冲突。
 */
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
 * 解析原始全局配置，同时保留语言是否由用户显式选择这一事实。
 *
 * 设计逻辑：
 * 1. 仅仅知道最终语言值还不够，还要知道它是不是用户明确选过的。
 * 2. 如果语言只是默认值，而不是用户选择值，首次交互式 init 仍然要弹出语言选择。
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
 * 加载可变更的全局配置状态，并同时保留回滚快照。
 *
 * 设计逻辑：
 * 1. init 会同时改全局配置和数据库索引，因此必须先拿到回滚基线。
 * 2. 这样一旦后续任一步失败，就能把磁盘状态恢复到命令开始前。
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

/**
 * 在首次交互式初始化时选择交互语言。
 *
 * 设计逻辑：
 * 1. 提示文案同时展示三种语言，保证用户即使还没选语言也能理解。
 * 2. 未输入或输入无法识别时默认回退中文，避免初始化被非关键输入阻塞。
 */
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

function buildHelpText(messages: MessageCatalog): string {
  return [
    messages.init.helpDescription,
    '',
    'foxpilot init',
    'fp init',
    '--path <project-root>',
    '--name <project-name>',
    '--workspace-root <workspace-root>',
    '--profile default|collaboration|minimal',
    '--mode interactive|non-interactive',
    '--preview',
    '--json',
    '--no-scan',
  ].join('\n')
}

function buildPlatformStagesSummary(
  preview: InitPreviewResult['orchestrationPreview']['platformResolution'],
): string {
  return preview.stages
    .map((stage) => `${stage.stage}:${stage.platform.effective}(${stage.platform.source})`)
    .join(', ')
}

function createInitPreviewResult(input: {
  projectRoot: string
  projectName: string
  workspaceRoot: string
  repositories: ProjectRepositoryConfig[]
  scanSignals: Awaited<ReturnType<typeof collectProjectScanSignals>>
  recommendation: ReturnType<typeof createInitRecommendation>
  selectedProfile: InitPreviewResult['orchestrationPreview']['selectedProfile']
  platformResolution: InitPreviewResult['orchestrationPreview']['platformResolution']
  outputs?: InitPreviewResult['outputs']
}): InitPreviewResult {
  return {
    projectRoot: input.projectRoot,
    projectName: input.projectName,
    workspaceRoot: input.workspaceRoot,
    repositories: input.repositories.map((repository) => ({
      name: repository.name,
      path: repository.path,
      repoType: repository.repoType,
      languageStack: repository.languageStack,
    })),
    scanSignals: input.scanSignals,
    recommendation: input.recommendation,
    orchestrationPreview: {
      selectedProfile: input.selectedProfile,
      recommendedProfile: input.recommendation.profile.recommended,
      platformResolution: input.platformResolution,
    },
    outputs: input.outputs,
  }
}

function buildPreviewOutput(input: {
  messages: MessageCatalog
  preview: InitPreviewResult
}): string {
  return [
    '[FoxPilot] init 预览',
    `- projectRoot: ${input.preview.projectRoot}`,
    `- projectName: ${input.preview.projectName}`,
    `- workspaceRoot: ${input.preview.workspaceRoot}`,
    `- repositories: ${input.preview.repositories.length}`,
    `- profile: ${input.preview.orchestrationPreview.selectedProfile}`,
    `- recommendedProfile: ${input.preview.orchestrationPreview.recommendedProfile}`,
    `- workflowTemplate: ${input.preview.recommendation.workflowTemplate.recommended}`,
    `- repositoryLayout: ${input.preview.scanSignals.structure.repositoryLayout}`,
    `- likelyProjectType: ${input.preview.scanSignals.workflow.likelyProjectType}`,
    `- platformStages: ${buildPlatformStagesSummary(input.preview.orchestrationPreview.platformResolution)}`,
    '',
    input.messages.init.completedNextStep,
  ].join('\n')
}

function buildSuccessOutput(input: {
  messages: MessageCatalog
  projectRoot: string
  projectName: string
  workspaceRoot: string
  profile: string
  recommendedProfile: string
  repositories: ProjectRepositoryConfig[]
  platformStageCount: number
  projectConfigPath: string
  globalConfigPath: string
  dbPath: string
}): string {
  return [
    input.messages.init.targetConfirmed,
    `- projectRoot: ${input.projectRoot}`,
    `- projectName: ${input.projectName}`,
    `- workspaceRoot: ${input.workspaceRoot}`,
    `- profile: ${input.profile}`,
    `- recommendedProfile: ${input.recommendedProfile}`,
    `- repositories: ${input.repositories.length}`,
    `- platformStages: ${input.platformStageCount}`,
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

/**
 * 校验项目根目录是否合法。
 *
 * 这里只处理“路径是否存在、是否为目录”这类前置校验，
 * 更细的业务约束交给后续流程处理。
 */
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

  /**
   * 设计逻辑：
   * 1. 如果用户没显式传入工作区根目录，就优先复用已有配置里的最长匹配工作区。
   * 2. 如果完全匹配不到，再回退为项目根目录的父目录。
   */
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
 * 当 init 在部分成功后失败时，回滚全局配置和索引写入。
 *
 * 设计逻辑：
 * 1. 回滚顺序先恢复全局配置，再删除索引，避免出现“配置恢复了但索引还脏着”的中间状态。
 * 2. 这样可以让用户再次执行 init 时看到一个可预测、可重试的环境。
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
 * 初始化受管项目，写入全局配置，启动索引数据库，并写入项目清单。
 *
 * 设计逻辑：
 * 1. 初始化不是单文件写入，而是“项目配置 + 全局配置 + 全局索引”的多资源事务流程。
 * 2. 真正的数据库事务无法覆盖文件系统，因此这里通过“快照 + 补偿”实现近似事务效果。
 * 3. 项目配置写在最后，只有当前面的全局状态和索引都准备好后，才把项目正式标记为已接管。
 */
export async function runInitCommand(args: InitArgs, context: InitCommandContext): Promise<CliResult> {
  let messages = getMessages(context.interfaceLanguage)
  const commandName = args.preview ? 'init.preview' : 'init'

  const createSuccessResult = (stdout: string, data: InitPreviewResult): CliResult => {
    if (args.json) {
      return {
        exitCode: 0,
        stdout: toJsonSuccessOutput(commandName, data),
      }
    }

    return {
      exitCode: 0,
      stdout,
    }
  }

  const createErrorResult = (input: {
    exitCode: number
    code: string
    message: string
    stdout: string
    details?: Record<string, unknown>
  }): CliResult => {
    if (args.json) {
      return {
        exitCode: input.exitCode,
        stdout: toJsonErrorOutput(commandName, {
          code: input.code,
          message: input.message,
          details: input.details,
        }),
      }
    }

    return {
      exitCode: input.exitCode,
      stdout: input.stdout,
    }
  }

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(messages),
    }
  }

  const dependencies = getDependencies(context.dependencies)
  const projectRoot = path.resolve(context.cwd, args.path ?? '.')
  const projectConfigPath = resolveProjectConfigPath(projectRoot)
  const validationError = await validateProjectRoot(projectRoot, messages)

  if (validationError) {
    return createErrorResult({
      exitCode: validationError.exitCode,
      code: validationError.stdout.includes(messages.init.pathNotFound)
        ? 'PROJECT_PATH_NOT_FOUND'
        : 'PROJECT_PATH_NOT_DIRECTORY',
      message: validationError.stdout.includes(messages.init.pathNotFound)
        ? messages.init.pathNotFound
        : messages.init.pathNotDirectory,
      stdout: validationError.stdout,
      details: {
        projectRoot,
      },
    })
  }

  if (await fileExists(projectConfigPath)) {
    return createErrorResult({
      exitCode: 2,
      code: 'PROJECT_CONFIG_EXISTS',
      message: messages.init.projectConfigExists,
      stdout: buildErrorOutput(messages.init.projectConfigExists, [`- ${projectConfigPath}`]),
      details: {
        projectConfigPath,
      },
    })
  }

  let globalConfigState: Awaited<ReturnType<typeof loadGlobalConfigSnapshot>>
  try {
    globalConfigState = await loadGlobalConfigSnapshot(context.homeDir)
  } catch (error) {
    if (error instanceof GlobalConfigParseError) {
      return createErrorResult({
        exitCode: 3,
        code: 'GLOBAL_CONFIG_MALFORMED',
        message: messages.init.malformedGlobalConfig,
        stdout: buildErrorOutput(messages.init.malformedGlobalConfig, [
          `- ${error.configPath}`,
        ]),
        details: {
          configPath: error.configPath,
        },
      })
    }

    throw error
  }

  const lines: string[] = []
  const interactiveInput = [...context.stdin]
  let projectName = args.name ?? (path.basename(projectRoot) || 'project')
  let interfaceLanguage = globalConfigState.config.interfaceLanguage

  /**
   * 设计逻辑：
   * 1. 只有首次交互式初始化才主动询问语言。
   * 2. 一旦语言已经被持久化，后续 init 不再重复打扰用户。
   */
  if (args.mode === 'interactive' && !args.preview && !globalConfigState.hasStoredInterfaceLanguage) {
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
  const scanSignals = await collectProjectScanSignals({
    projectRoot,
    repositories,
  })
  const initRecommendation = createInitRecommendation(scanSignals)
  const selectedProfile = resolveProjectProfileId(args.profile ?? initRecommendation.profile.recommended)

  if (args.mode === 'interactive' && !args.preview) {
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
      return createErrorResult({
        exitCode: 1,
        code: 'INIT_CANCELLED',
        message: messages.init.cancelled,
        stdout: [...lines, messages.init.cancelled].join('\n'),
      })
    }

    projectName = interactiveResult.projectName
    workspaceRoot = path.resolve(context.cwd, interactiveResult.workspaceRoot)
  }

  if (!isWithin(workspaceRoot, projectRoot)) {
    return createErrorResult({
      exitCode: 1,
      code: 'WORKSPACE_ROOT_MISMATCH',
      message: messages.init.workspaceRootMismatch,
      stdout: buildErrorOutput(messages.init.workspaceRootMismatch, [
        `- workspaceRoot: ${workspaceRoot}`,
        `- projectRoot: ${projectRoot}`,
      ]),
      details: {
        workspaceRoot,
        projectRoot,
      },
    })
  }

  const platformResolution = await dependencies.resolvePlatformResolution({
    profile: selectedProfile,
  })

  const previewResult = createInitPreviewResult({
    projectRoot,
    projectName,
    workspaceRoot,
    repositories,
    scanSignals,
    recommendation: initRecommendation,
    selectedProfile,
    platformResolution,
  })

  if (args.preview) {
    return createSuccessResult(
      buildPreviewOutput({
        messages,
        preview: previewResult,
      }),
      previewResult,
    )
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
      return createErrorResult({
        exitCode: 3,
        code: 'GLOBAL_CONFIG_MALFORMED',
        message: messages.init.malformedGlobalConfig,
        stdout: buildErrorOutput(messages.init.malformedGlobalConfig, [
          `- ${error.configPath}`,
        ]),
        details: {
          configPath: error.configPath,
        },
      })
    }

    await restoreFileSnapshot(globalConfigState.configPath, globalConfigState.snapshot)
    return createErrorResult({
      exitCode: 1,
      code: 'GLOBAL_CONFIG_WRITE_FAILED',
      message: messages.init.globalConfigWriteFailed,
      stdout: messages.init.globalConfigWriteFailed,
    })
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
    return createErrorResult({
      exitCode: 4,
      code: 'DATABASE_BOOTSTRAP_FAILED',
      message: messages.init.dbBootstrapFailed,
      stdout: buildErrorOutput(messages.init.dbBootstrapFailed, [`- ${dbPath}`]),
      details: {
        dbPath,
      },
    })
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
    return createErrorResult({
      exitCode: 1,
      code: 'CATALOG_WRITE_FAILED',
      message: messages.init.catalogWriteFailed,
      stdout: messages.init.catalogWriteFailed,
    })
  }

  try {
    await dependencies.writeProjectConfig({
      projectRoot,
      name: projectName,
      repositories,
      orchestration: {
        profile: {
          selected: selectedProfile,
        },
        platformResolution,
      },
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
      return createErrorResult({
        exitCode: 2,
        code: 'PROJECT_CONFIG_EXISTS',
        message: messages.init.projectConfigExists,
        stdout: buildErrorOutput(messages.init.projectConfigExists, [`- ${error.configPath}`]),
        details: {
          projectConfigPath: error.configPath,
        },
      })
    }

    return createErrorResult({
      exitCode: 1,
      code: 'PROJECT_CONFIG_WRITE_FAILED',
      message: messages.init.projectConfigWriteFailed,
      stdout: messages.init.projectConfigWriteFailed,
    })
  }

  db.close()

  const appliedResult = createInitPreviewResult({
    projectRoot,
    projectName,
    workspaceRoot,
    repositories,
    scanSignals,
    recommendation: initRecommendation,
    selectedProfile,
    platformResolution,
    outputs: {
      projectConfigPath,
      globalConfigPath: ensureResult.configPath,
      dbPath,
    },
  })

  return createSuccessResult(
    [...lines, buildSuccessOutput({
      messages,
      projectRoot,
      projectName,
      workspaceRoot,
      profile: selectedProfile,
      recommendedProfile: initRecommendation.profile.recommended,
      repositories,
      platformStageCount: platformResolution.stages.length,
      projectConfigPath,
      globalConfigPath: ensureResult.configPath,
      dbPath,
    })].filter(Boolean).join('\n'),
    appliedResult,
  )
}
