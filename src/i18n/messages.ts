/**
 * @file src/i18n/messages.ts
 * @author michaeljou
 */

import type { InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * 命令处理器使用的完整本地化消息集合。
 */
export type MessageCatalog = {
  common: {
    unknownCommand: string
  }
  init: {
    helpDescription: string
    cancelled: string
    targetConfirmed: string
    projectConfigGenerated: string
    globalConfigConfirmed: string
    globalDatabaseConfirmed: string
    catalogWritten: string
    completed: string
    completedNextStep: string
    projectRootPrompt: (projectRoot: string) => string
    projectNamePrompt: (projectName: string) => string
    workspaceRootPrompt: (workspaceRoot: string) => string
    detectedRepositories: string
    writeRepositoriesPrompt: string
    continuePrompt: string
    enterProjectName: string
    enterWorkspaceRoot: string
    selectInterfaceLanguage: string
    languageChoices: string[]
    pathNotFound: string
    pathNotDirectory: string
    projectConfigExists: string
    malformedGlobalConfig: string
    workspaceRootMismatch: string
    globalConfigWriteFailed: string
    dbBootstrapFailed: string
    catalogWriteFailed: string
    projectConfigWriteFailed: string
  }
  taskCreate: {
    helpDescription: string
    titleRequired: string
    malformedGlobalConfig: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    repositoryNotFound: string
    projectNotIndexed: string
    created: string
  }
  taskList: {
    helpDescription: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    empty: string
    title: string
  }
  taskShow: {
    helpDescription: string
    idRequired: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    taskNotFound: string
    title: string
    targetsTitle: string
    runsTitle: string
    noTargets: string
    noRuns: string
  }
  taskHistory: {
    helpDescription: string
    idRequired: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    taskNotFound: string
    title: string
    noRuns: string
  }
  taskSuggestScan: {
    helpDescription: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    created: string
    taskTitle: (repositoryName: string) => string
  }
  taskUpdateStatus: {
      helpDescription: string
      idRequired: string
      statusRequired: string
      projectNotInitialized: string
      dbBootstrapFailed: string
      taskNotFound: string
      invalidTransition: string
    unchanged: string
    updated: string
  }
  taskUpdateExecutor: {
    helpDescription: string
    idRequired: string
    executorRequired: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    taskNotFound: string
    unchanged: string
    updated: string
  }
  configSetLanguage: {
    helpDescription: string
    invalidLanguage: string
    malformedGlobalConfig: string
    updated: string
  }
}

const messageCatalogs: Record<InterfaceLanguage, MessageCatalog> = {
  'zh-CN': {
    common: {
      unknownCommand: '[FoxPilot] 未知命令',
    },
    init: {
      helpDescription: '初始化一个受管项目，并写入项目配置、全局配置和 SQLite 索引。',
      cancelled: '[FoxPilot] 初始化已取消',
      targetConfirmed: '[FoxPilot] 初始化目标已确认',
      projectConfigGenerated: '[FoxPilot] 已生成项目配置',
      globalConfigConfirmed: '[FoxPilot] 已确认全局配置',
      globalDatabaseConfirmed: '[FoxPilot] 已确认全局数据库',
      catalogWritten: '[FoxPilot] 已写入项目索引',
      completed: '[FoxPilot] 初始化完成',
      completedNextStep: '后续可继续执行任务登记、项目扫描建议或桌面端接管流程。',
      projectRootPrompt: (projectRoot) => `项目根目录: ${projectRoot}\n是否使用这个目录初始化？ [Y/n]`,
      projectNamePrompt: (projectName) => `项目名默认为 ${projectName}，是否确认？ [Y/n]`,
      workspaceRootPrompt: (workspaceRoot) => `推断工作区根目录为 ${workspaceRoot}，是否确认？ [Y/n]`,
      detectedRepositories: '识别到以下仓库候选:',
      writeRepositoriesPrompt: '是否按该结果写入？ [Y/n]',
      continuePrompt: '将生成项目配置并写入全局索引，是否继续？ [Y/n]',
      enterProjectName: '请输入项目名:',
      enterWorkspaceRoot: '请输入工作区根目录:',
      selectInterfaceLanguage: '选择交互语言 / Select interface language / インターフェース言語を選択',
      languageChoices: ['1. 中文', '2. English', '3. 日本語'],
      pathNotFound: '[FoxPilot] 初始化失败: 目标路径不存在',
      pathNotDirectory: '[FoxPilot] 初始化失败: 目标路径不是目录',
      projectConfigExists: '[FoxPilot] 初始化中止: 项目已存在配置',
      malformedGlobalConfig: '[FoxPilot] 初始化失败: foxpilot.config.json 格式错误',
      workspaceRootMismatch: '[FoxPilot] 初始化失败: workspace root 不包含项目路径',
      globalConfigWriteFailed: '[FoxPilot] 初始化失败: 全局配置写入失败',
      dbBootstrapFailed: '[FoxPilot] 初始化失败: foxpilot.db 初始化失败',
      catalogWriteFailed: '[FoxPilot] 初始化失败: 项目索引写入失败',
      projectConfigWriteFailed: '[FoxPilot] 初始化失败: 项目配置写入失败',
    },
    taskCreate: {
      helpDescription: '为当前受管项目创建一个手动任务。',
      titleRequired: '[FoxPilot] 任务创建失败: title 不能为空',
      malformedGlobalConfig: '[FoxPilot] 任务创建失败: foxpilot.config.json 格式错误',
      projectNotInitialized: '[FoxPilot] 任务创建失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务创建失败: foxpilot.db 初始化失败',
      repositoryNotFound: '[FoxPilot] 任务创建失败: 未找到仓库目标',
      projectNotIndexed: '[FoxPilot] 任务创建失败: 项目未接入全局索引',
      created: '[FoxPilot] 已创建任务',
    },
    taskList: {
      helpDescription: '列出当前项目下的任务，可按状态过滤。',
      projectNotInitialized: '[FoxPilot] 任务列表失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务列表失败: foxpilot.db 初始化失败',
      empty: '[FoxPilot] 当前没有匹配任务',
      title: '[FoxPilot] 任务列表',
    },
    taskShow: {
      helpDescription: '查看单个任务的详情和目标列表。',
      idRequired: '[FoxPilot] 任务详情失败: id 不能为空',
      projectNotInitialized: '[FoxPilot] 任务详情失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务详情失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] 任务详情失败: 未找到任务',
      title: '[FoxPilot] 任务详情',
      targetsTitle: '[FoxPilot] 任务目标',
      noTargets: '- (none)',
      runsTitle: '[FoxPilot] 任务运行历史',
      noRuns: '- 暂无运行历史',
    },
    taskHistory: {
      helpDescription: '查看单个任务的完整运行历史。',
      idRequired: '[FoxPilot] 任务历史失败: id 不能为空',
      projectNotInitialized: '[FoxPilot] 任务历史失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务历史失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] 任务历史失败: 未找到任务',
      title: '[FoxPilot] 任务运行历史',
      noRuns: '- 暂无运行历史',
    },
    taskSuggestScan: {
      helpDescription: '为当前项目的仓库生成扫描建议任务。',
      projectNotInitialized: '[FoxPilot] 扫描建议失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 扫描建议失败: foxpilot.db 初始化失败',
      created: '[FoxPilot] 已生成扫描建议任务',
      taskTitle: (repositoryName) => `扫描建议: ${repositoryName}`,
    },
    taskUpdateStatus: {
      helpDescription: '更新当前项目中某个任务的状态。',
      idRequired: '[FoxPilot] 任务状态更新失败: id 不能为空',
      statusRequired: '[FoxPilot] 任务状态更新失败: status 非法或缺失',
      projectNotInitialized: '[FoxPilot] 任务状态更新失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务状态更新失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] 任务状态更新失败: 未找到任务',
      invalidTransition: '[FoxPilot] 任务状态更新失败: 状态流转不合法',
      unchanged: '[FoxPilot] 任务状态未变化',
      updated: '[FoxPilot] 已更新任务状态',
    },
    taskUpdateExecutor: {
      helpDescription: '更新当前项目中某个任务的责任执行器。',
      idRequired: '[FoxPilot] 任务执行器更新失败: id 不能为空',
      executorRequired: '[FoxPilot] 任务执行器更新失败: executor 非法或缺失',
      projectNotInitialized: '[FoxPilot] 任务执行器更新失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务执行器更新失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] 任务执行器更新失败: 未找到任务',
      unchanged: '[FoxPilot] 任务执行器未变化',
      updated: '[FoxPilot] 已更新任务执行器',
    },
    configSetLanguage: {
      helpDescription: '设置 CLI 交互语言。',
      invalidLanguage: '[FoxPilot] 语言设置失败: lang 非法或缺失',
      malformedGlobalConfig: '[FoxPilot] 语言设置失败: foxpilot.config.json 格式错误',
      updated: '[FoxPilot] 已更新交互语言',
    },
  },
  'en-US': {
    common: {
      unknownCommand: '[FoxPilot] Unknown command',
    },
    init: {
      helpDescription: 'Initialize a managed project and write project config, global config, and SQLite catalog state.',
      cancelled: '[FoxPilot] Initialization cancelled',
      targetConfirmed: '[FoxPilot] Initialization target confirmed',
      projectConfigGenerated: '[FoxPilot] Project config generated',
      globalConfigConfirmed: '[FoxPilot] Global config confirmed',
      globalDatabaseConfirmed: '[FoxPilot] Global database confirmed',
      catalogWritten: '[FoxPilot] Project catalog updated',
      completed: '[FoxPilot] Initialization completed',
      completedNextStep: 'You can continue with task registration, project scan suggestions, or desktop takeover.',
      projectRootPrompt: (projectRoot) => `Project root: ${projectRoot}\nUse this directory for initialization? [Y/n]`,
      projectNamePrompt: (projectName) => `Default project name is ${projectName}. Confirm? [Y/n]`,
      workspaceRootPrompt: (workspaceRoot) => `Detected workspace root ${workspaceRoot}. Confirm? [Y/n]`,
      detectedRepositories: 'Detected repository candidates:',
      writeRepositoriesPrompt: 'Write this repository result? [Y/n]',
      continuePrompt: 'Project config and global catalog will be written. Continue? [Y/n]',
      enterProjectName: 'Enter project name:',
      enterWorkspaceRoot: 'Enter workspace root:',
      selectInterfaceLanguage: 'Select interface language / 选择交互语言 / インターフェース言語を選択',
      languageChoices: ['1. 中文', '2. English', '3. 日本語'],
      pathNotFound: '[FoxPilot] Initialization failed: target path does not exist',
      pathNotDirectory: '[FoxPilot] Initialization failed: target path is not a directory',
      projectConfigExists: '[FoxPilot] Initialization aborted: project config already exists',
      malformedGlobalConfig: '[FoxPilot] Initialization failed: foxpilot.config.json is malformed',
      workspaceRootMismatch: '[FoxPilot] Initialization failed: workspace root does not contain project path',
      globalConfigWriteFailed: '[FoxPilot] Initialization failed: failed to write global config',
      dbBootstrapFailed: '[FoxPilot] Initialization failed: failed to initialize foxpilot.db',
      catalogWriteFailed: '[FoxPilot] Initialization failed: failed to write project catalog',
      projectConfigWriteFailed: '[FoxPilot] Initialization failed: failed to write project config',
    },
    taskCreate: {
      helpDescription: 'Create a manual task for the current managed project.',
      titleRequired: '[FoxPilot] Task creation failed: title is required',
      malformedGlobalConfig: '[FoxPilot] Task creation failed: foxpilot.config.json is malformed',
      projectNotInitialized: '[FoxPilot] Task creation failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task creation failed: failed to initialize foxpilot.db',
      repositoryNotFound: '[FoxPilot] Task creation failed: repository target was not found',
      projectNotIndexed: '[FoxPilot] Task creation failed: project is not indexed globally',
      created: '[FoxPilot] Task created',
    },
    taskList: {
      helpDescription: 'List tasks for the current project.',
      projectNotInitialized: '[FoxPilot] Task list failed: Project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task list failed: failed to initialize foxpilot.db',
      empty: '[FoxPilot] No matching tasks',
      title: '[FoxPilot] Task list',
    },
    taskShow: {
      helpDescription: 'Show detail and targets for a single task.',
      idRequired: '[FoxPilot] Task detail failed: id is required',
      projectNotInitialized: '[FoxPilot] Task detail failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task detail failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Task detail failed: task was not found',
      title: '[FoxPilot] Task detail',
      targetsTitle: '[FoxPilot] Task targets',
      noTargets: '- (none)',
      runsTitle: '[FoxPilot] Task run history',
      noRuns: '- No run history yet',
    },
    taskHistory: {
      helpDescription: 'Show full run history for a single task.',
      idRequired: '[FoxPilot] Task history failed: id is required',
      projectNotInitialized: '[FoxPilot] Task history failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task history failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Task history failed: task was not found',
      title: '[FoxPilot] Task run history',
      noRuns: '- No run history yet',
    },
    taskSuggestScan: {
      helpDescription: 'Generate scan suggestion tasks for repositories in the current project.',
      projectNotInitialized: '[FoxPilot] Scan suggestion failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Scan suggestion failed: failed to initialize foxpilot.db',
      created: '[FoxPilot] Scan suggestion tasks created',
      taskTitle: (repositoryName) => `Scan suggestion: ${repositoryName}`,
    },
    taskUpdateStatus: {
      helpDescription: 'Update the status of one task in the current project.',
      idRequired: '[FoxPilot] Task status update failed: id is required',
      statusRequired: '[FoxPilot] Task status update failed: status is invalid or missing',
      projectNotInitialized: '[FoxPilot] Task status update failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task status update failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Task status update failed: task was not found',
      invalidTransition: '[FoxPilot] Task status update failed: invalid state transition',
      unchanged: '[FoxPilot] Task status unchanged',
      updated: '[FoxPilot] Task status updated',
    },
    taskUpdateExecutor: {
      helpDescription: 'Update the responsible executor of one task in the current project.',
      idRequired: '[FoxPilot] Task executor update failed: id is required',
      executorRequired: '[FoxPilot] Task executor update failed: executor is invalid or missing',
      projectNotInitialized: '[FoxPilot] Task executor update failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task executor update failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Task executor update failed: task was not found',
      unchanged: '[FoxPilot] Task executor unchanged',
      updated: '[FoxPilot] Task executor updated',
    },
    configSetLanguage: {
      helpDescription: 'Set the CLI interface language.',
      invalidLanguage: '[FoxPilot] Language update failed: lang is invalid or missing',
      malformedGlobalConfig: '[FoxPilot] Language update failed: foxpilot.config.json is malformed',
      updated: '[FoxPilot] Interface language updated',
    },
  },
  'ja-JP': {
    common: {
      unknownCommand: '[FoxPilot] 不明なコマンドです',
    },
    init: {
      helpDescription: '管理対象プロジェクトを初期化し、プロジェクト設定・グローバル設定・SQLite 索引を作成します。',
      cancelled: '[FoxPilot] 初期化をキャンセルしました',
      targetConfirmed: '[FoxPilot] 初期化対象を確認しました',
      projectConfigGenerated: '[FoxPilot] プロジェクト設定を生成しました',
      globalConfigConfirmed: '[FoxPilot] グローバル設定を確認しました',
      globalDatabaseConfirmed: '[FoxPilot] グローバルデータベースを確認しました',
      catalogWritten: '[FoxPilot] プロジェクト索引を書き込みました',
      completed: '[FoxPilot] 初期化が完了しました',
      completedNextStep: '続いてタスク登録、プロジェクト走査提案、またはデスクトップ引き継ぎを行えます。',
      projectRootPrompt: (projectRoot) => `プロジェクトルート: ${projectRoot}\nこのディレクトリで初期化しますか？ [Y/n]`,
      projectNamePrompt: (projectName) => `既定のプロジェクト名は ${projectName} です。確定しますか？ [Y/n]`,
      workspaceRootPrompt: (workspaceRoot) => `推定したワークスペースルートは ${workspaceRoot} です。確定しますか？ [Y/n]`,
      detectedRepositories: '検出したリポジトリ候補:',
      writeRepositoriesPrompt: 'このリポジトリ結果を書き込みますか？ [Y/n]',
      continuePrompt: 'プロジェクト設定とグローバル索引を書き込みます。続行しますか？ [Y/n]',
      enterProjectName: 'プロジェクト名を入力してください:',
      enterWorkspaceRoot: 'ワークスペースルートを入力してください:',
      selectInterfaceLanguage: 'インターフェース言語を選択 / Select interface language / 选择交互语言',
      languageChoices: ['1. 中文', '2. English', '3. 日本語'],
      pathNotFound: '[FoxPilot] 初期化に失敗しました: 対象パスが存在しません',
      pathNotDirectory: '[FoxPilot] 初期化に失敗しました: 対象パスがディレクトリではありません',
      projectConfigExists: '[FoxPilot] 初期化を中止しました: プロジェクト設定が既に存在します',
      malformedGlobalConfig: '[FoxPilot] 初期化に失敗しました: foxpilot.config.json の形式が不正です',
      workspaceRootMismatch: '[FoxPilot] 初期化に失敗しました: workspace root に project path が含まれていません',
      globalConfigWriteFailed: '[FoxPilot] 初期化に失敗しました: グローバル設定の書き込みに失敗しました',
      dbBootstrapFailed: '[FoxPilot] 初期化に失敗しました: foxpilot.db の初期化に失敗しました',
      catalogWriteFailed: '[FoxPilot] 初期化に失敗しました: プロジェクト索引の書き込みに失敗しました',
      projectConfigWriteFailed: '[FoxPilot] 初期化に失敗しました: プロジェクト設定の書き込みに失敗しました',
    },
    taskCreate: {
      helpDescription: '現在の管理対象プロジェクトに手動タスクを作成します。',
      titleRequired: '[FoxPilot] タスク作成に失敗しました: title は必須です',
      malformedGlobalConfig: '[FoxPilot] タスク作成に失敗しました: foxpilot.config.json の形式が不正です',
      projectNotInitialized: '[FoxPilot] タスク作成に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク作成に失敗しました: foxpilot.db の初期化に失敗しました',
      repositoryNotFound: '[FoxPilot] タスク作成に失敗しました: リポジトリ対象が見つかりません',
      projectNotIndexed: '[FoxPilot] タスク作成に失敗しました: プロジェクトがグローバル索引に未登録です',
      created: '[FoxPilot] タスクを作成しました',
    },
    taskList: {
      helpDescription: '現在のプロジェクトのタスク一覧を表示します。',
      projectNotInitialized: '[FoxPilot] タスクリストに失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスクリストに失敗しました: foxpilot.db の初期化に失敗しました',
      empty: '[FoxPilot] 条件に一致するタスクはありません',
      title: '[FoxPilot] タスクリスト',
    },
    taskShow: {
      helpDescription: '単一タスクの詳細と対象一覧を表示します。',
      idRequired: '[FoxPilot] タスク詳細に失敗しました: id は必須です',
      projectNotInitialized: '[FoxPilot] タスク詳細に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク詳細に失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] タスク詳細に失敗しました: タスクが見つかりません',
      title: '[FoxPilot] タスク詳細',
      targetsTitle: '[FoxPilot] タスク対象',
      noTargets: '- (none)',
      runsTitle: '[FoxPilot] タスク実行履歴',
      noRuns: '- 実行履歴はまだありません',
    },
    taskHistory: {
      helpDescription: '単一タスクの完全な実行履歴を表示します。',
      idRequired: '[FoxPilot] タスク履歴に失敗しました: id は必須です',
      projectNotInitialized: '[FoxPilot] タスク履歴に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク履歴に失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] タスク履歴に失敗しました: タスクが見つかりません',
      title: '[FoxPilot] タスク実行履歴',
      noRuns: '- 実行履歴はまだありません',
    },
    taskSuggestScan: {
      helpDescription: '現在のプロジェクト内のリポジトリに対して走査提案タスクを生成します。',
      projectNotInitialized: '[FoxPilot] 走査提案に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] 走査提案に失敗しました: foxpilot.db の初期化に失敗しました',
      created: '[FoxPilot] 走査提案タスクを生成しました',
      taskTitle: (repositoryName) => `スキャン提案: ${repositoryName}`,
    },
    taskUpdateStatus: {
      helpDescription: '現在のプロジェクト内のタスク状態を更新します。',
      idRequired: '[FoxPilot] タスク状態更新に失敗しました: id は必須です',
      statusRequired: '[FoxPilot] タスク状態更新に失敗しました: status が不正または不足しています',
      projectNotInitialized: '[FoxPilot] タスク状態更新に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク状態更新に失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] タスク状態更新に失敗しました: タスクが見つかりません',
      invalidTransition: '[FoxPilot] タスク状態更新に失敗しました: 状態遷移が不正です',
      unchanged: '[FoxPilot] タスク状態は変化していません',
      updated: '[FoxPilot] タスク状態を更新しました',
    },
    taskUpdateExecutor: {
      helpDescription: '現在のプロジェクト内のタスク責任実行者を更新します。',
      idRequired: '[FoxPilot] タスク実行者更新に失敗しました: id は必須です',
      executorRequired: '[FoxPilot] タスク実行者更新に失敗しました: executor が不正または不足しています',
      projectNotInitialized: '[FoxPilot] タスク実行者更新に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク実行者更新に失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] タスク実行者更新に失敗しました: タスクが見つかりません',
      unchanged: '[FoxPilot] タスク実行者は変化していません',
      updated: '[FoxPilot] タスク実行者を更新しました',
    },
    configSetLanguage: {
      helpDescription: 'CLI の表示言語を設定します。',
      invalidLanguage: '[FoxPilot] 言語設定に失敗しました: lang が不正または不足しています',
      malformedGlobalConfig: '[FoxPilot] 言語設定に失敗しました: foxpilot.config.json の形式が不正です',
      updated: '[FoxPilot] インターフェース言語を更新しました',
    },
  },
}

/**
 * 根据已解析的交互语言返回对应的消息集合。
 */
export function getMessages(language: InterfaceLanguage): MessageCatalog {
  return messageCatalogs[language]
}
