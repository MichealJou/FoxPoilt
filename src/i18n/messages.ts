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
  taskBeadsSummary: {
    helpDescription: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    empty: string
    title: string
  }
  taskList: {
    helpDescription: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    empty: string
    title: string
  }
  taskNext: {
    helpDescription: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    empty: string
    title: string
  }
  taskEdit: {
    helpDescription: string
    idRequired: string
    titleRequired: string
    descriptionRequired: string
    noChangesSpecified: string
    conflictingDescription: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    taskNotFound: string
    unchanged: string
    updated: string
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
  taskPushBeads: {
    helpDescription: string
    targetRequired: string
    idRequired: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    taskNotFound: string
    notImportedTask: string
    repositoryNotFound: string
    repositoryNotInitialized: string
    pushFailed: string
    completed: string
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
  taskImportBeads: {
    helpDescription: string
    fileRequired: string
    fileReadFailed: string
    invalidJson: string
    invalidPayload: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    completed: string
    rejectedTitle: string
  }
  taskSyncBeads: {
    helpDescription: string
    repositoryRequired: string
    repositoryNotFound: string
    readFailed: string
    invalidJson: string
    invalidPayload: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    completed: string
    rejectedTitle: string
  }
  taskDiffBeads: {
    helpDescription: string
    fileRequired: string
    fileReadFailed: string
    invalidJson: string
    invalidPayload: string
    repositoryNotFound: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    title: string
    detailsTitle: string
    noChanges: string
    rejectedTitle: string
  }
  taskExportBeads: {
    helpDescription: string
    fileRequired: string
    projectNotInitialized: string
    dbBootstrapFailed: string
    writeFailed: string
    completed: string
    rejectedTitle: string
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
  taskUpdatePriority: {
    helpDescription: string
    idRequired: string
    priorityRequired: string
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
    taskBeadsSummary: {
      helpDescription: '查看当前项目内 Beads 同步任务的聚合摘要。',
      projectNotInitialized: '[FoxPilot] Beads 摘要失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] Beads 摘要失败: foxpilot.db 初始化失败',
      empty: '[FoxPilot] 当前项目没有 Beads 同步任务',
      title: '[FoxPilot] Beads 任务摘要',
    },
    taskList: {
      helpDescription: '列出当前项目下的任务，可按状态过滤。',
      projectNotInitialized: '[FoxPilot] 任务列表失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务列表失败: foxpilot.db 初始化失败',
      empty: '[FoxPilot] 当前没有匹配任务',
      title: '[FoxPilot] 任务列表',
    },
    taskNext: {
      helpDescription: '显示当前项目下一条最值得先推进的任务。',
      projectNotInitialized: '[FoxPilot] 下一条任务查询失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 下一条任务查询失败: foxpilot.db 初始化失败',
      empty: '[FoxPilot] 当前没有可推进任务',
      title: '[FoxPilot] 下一条任务',
    },
    taskEdit: {
      helpDescription: '编辑当前项目中某个任务的标题、描述或任务类型。',
      idRequired: '[FoxPilot] 任务编辑失败: id 或 external-id 不能为空',
      titleRequired: '[FoxPilot] 任务编辑失败: title 不能为空',
      descriptionRequired: '[FoxPilot] 任务编辑失败: description 不能为空',
      noChangesSpecified: '[FoxPilot] 任务编辑失败: 至少指定一个可编辑字段',
      conflictingDescription: '[FoxPilot] 任务编辑失败: description 参数冲突',
      projectNotInitialized: '[FoxPilot] 任务编辑失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务编辑失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] 任务编辑失败: 未找到任务',
      unchanged: '[FoxPilot] 任务元数据未变化',
      updated: '[FoxPilot] 已更新任务元数据',
    },
    taskShow: {
      helpDescription: '查看单个任务的详情和目标列表。',
      idRequired: '[FoxPilot] 任务详情失败: id 或 external-id 不能为空',
      projectNotInitialized: '[FoxPilot] 任务详情失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务详情失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] 任务详情失败: 未找到任务',
      title: '[FoxPilot] 任务详情',
      targetsTitle: '[FoxPilot] 任务目标',
      noTargets: '- (none)',
      runsTitle: '[FoxPilot] 任务运行历史',
      noRuns: '- 暂无运行历史',
    },
    taskPushBeads: {
      helpDescription: '把当前项目中的单条 Beads 导入任务回写到本地 bd 仓库。',
      targetRequired: '[FoxPilot] Beads 回写失败: id、external-id、repository 或 --all-repositories 必须提供其一',
      idRequired: '[FoxPilot] Beads 回写失败: id 或 external-id 不能为空',
      projectNotInitialized: '[FoxPilot] Beads 回写失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] Beads 回写失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] Beads 回写失败: 未找到任务',
      notImportedTask: '[FoxPilot] Beads 回写失败: 任务不是 Beads 导入任务',
      repositoryNotFound: '[FoxPilot] Beads 回写失败: repository 不存在',
      repositoryNotInitialized: '[FoxPilot] Beads 回写失败: 目标仓库未初始化本地 Beads',
      pushFailed: '[FoxPilot] Beads 回写失败: 无法执行 bd update',
      completed: '[FoxPilot] 已完成 Beads 回写',
    },
    taskHistory: {
      helpDescription: '查看单个任务的完整运行历史。',
      idRequired: '[FoxPilot] 任务历史失败: id 或 external-id 不能为空',
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
    taskImportBeads: {
      helpDescription: '从本地 JSON 快照导入 Beads 任务。',
      fileRequired: '[FoxPilot] Beads 导入失败: file 不能为空',
      fileReadFailed: '[FoxPilot] Beads 导入失败: 无法读取导入文件',
      invalidJson: '[FoxPilot] Beads 导入失败: JSON 格式错误',
      invalidPayload: '[FoxPilot] Beads 导入失败: 导入文件必须是任务数组',
      projectNotInitialized: '[FoxPilot] Beads 导入失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] Beads 导入失败: foxpilot.db 初始化失败',
      completed: '[FoxPilot] 已完成 Beads 任务导入',
      rejectedTitle: '[FoxPilot] 以下记录已拒绝',
    },
    taskSyncBeads: {
      helpDescription: '直接从指定仓库的 bd list 输出同步本地 Beads 任务。',
      repositoryRequired: '[FoxPilot] 本地 Beads 同步失败: repository 或 --all-repositories 必须提供其一',
      repositoryNotFound: '[FoxPilot] 本地 Beads 同步失败: repository 不存在',
      readFailed: '[FoxPilot] 本地 Beads 同步失败: 无法读取 bd list 输出',
      invalidJson: '[FoxPilot] 本地 Beads 同步失败: bd list 输出不是合法 JSON',
      invalidPayload: '[FoxPilot] 本地 Beads 同步失败: bd list 输出必须是任务数组',
      projectNotInitialized: '[FoxPilot] 本地 Beads 同步失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 本地 Beads 同步失败: foxpilot.db 初始化失败',
      completed: '[FoxPilot] 已完成本地 Beads 同步',
      rejectedTitle: '[FoxPilot] 以下记录已拒绝',
    },
    taskDiffBeads: {
      helpDescription: '预览本地 Beads 快照导入后会产生的差异。',
      fileRequired: '[FoxPilot] Beads 差异预览失败: file、repository 或 --all-repositories 必须提供其一',
      fileReadFailed: '[FoxPilot] Beads 差异预览失败: 无法读取预览来源',
      invalidJson: '[FoxPilot] Beads 差异预览失败: 预览来源 JSON 格式错误',
      invalidPayload: '[FoxPilot] Beads 差异预览失败: 预览来源必须是任务数组',
      repositoryNotFound: '[FoxPilot] Beads 差异预览失败: repository 不存在',
      projectNotInitialized: '[FoxPilot] Beads 差异预览失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] Beads 差异预览失败: foxpilot.db 初始化失败',
      title: '[FoxPilot] Beads 快照差异预览',
      detailsTitle: '[FoxPilot] 差异明细',
      noChanges: '- 当前没有可展示的差异',
      rejectedTitle: '[FoxPilot] 以下记录已拒绝',
    },
    taskExportBeads: {
      helpDescription: '把当前项目中的 Beads 同步任务导出为本地 JSON 快照。',
      fileRequired: '[FoxPilot] Beads 导出失败: file 不能为空',
      projectNotInitialized: '[FoxPilot] Beads 导出失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] Beads 导出失败: foxpilot.db 初始化失败',
      writeFailed: '[FoxPilot] Beads 导出失败: 无法写入导出文件',
      completed: '[FoxPilot] 已完成 Beads 任务导出',
      rejectedTitle: '[FoxPilot] 以下记录未能导出',
    },
    taskUpdateStatus: {
      helpDescription: '更新当前项目中某个任务的状态。',
      idRequired: '[FoxPilot] 任务状态更新失败: id 或 external-id 不能为空',
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
      idRequired: '[FoxPilot] 任务执行器更新失败: id 或 external-id 不能为空',
      executorRequired: '[FoxPilot] 任务执行器更新失败: executor 非法或缺失',
      projectNotInitialized: '[FoxPilot] 任务执行器更新失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务执行器更新失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] 任务执行器更新失败: 未找到任务',
      unchanged: '[FoxPilot] 任务执行器未变化',
      updated: '[FoxPilot] 已更新任务执行器',
    },
    taskUpdatePriority: {
      helpDescription: '更新当前项目中某个任务的优先级。',
      idRequired: '[FoxPilot] 任务优先级更新失败: id 或 external-id 不能为空',
      priorityRequired: '[FoxPilot] 任务优先级更新失败: priority 非法或缺失',
      projectNotInitialized: '[FoxPilot] 任务优先级更新失败: 项目尚未初始化',
      dbBootstrapFailed: '[FoxPilot] 任务优先级更新失败: foxpilot.db 初始化失败',
      taskNotFound: '[FoxPilot] 任务优先级更新失败: 未找到任务',
      unchanged: '[FoxPilot] 任务优先级未变化',
      updated: '[FoxPilot] 已更新任务优先级',
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
    taskBeadsSummary: {
      helpDescription: 'Show an aggregated summary of imported Beads tasks in the current project.',
      projectNotInitialized: '[FoxPilot] Beads summary failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Beads summary failed: failed to initialize foxpilot.db',
      empty: '[FoxPilot] No Beads sync tasks in the current project',
      title: '[FoxPilot] Beads task summary',
    },
    taskList: {
      helpDescription: 'List tasks for the current project.',
      projectNotInitialized: '[FoxPilot] Task list failed: Project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task list failed: failed to initialize foxpilot.db',
      empty: '[FoxPilot] No matching tasks',
      title: '[FoxPilot] Task list',
    },
    taskNext: {
      helpDescription: 'Show the next actionable task for the current project.',
      projectNotInitialized: '[FoxPilot] Next task lookup failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Next task lookup failed: failed to initialize foxpilot.db',
      empty: '[FoxPilot] No actionable task right now',
      title: '[FoxPilot] Next task',
    },
    taskEdit: {
      helpDescription: 'Edit the title, description, or task type of one task in the current project.',
      idRequired: '[FoxPilot] Task edit failed: id or external-id is required',
      titleRequired: '[FoxPilot] Task edit failed: title is required',
      descriptionRequired: '[FoxPilot] Task edit failed: description is required',
      noChangesSpecified: '[FoxPilot] Task edit failed: at least one editable field is required',
      conflictingDescription: '[FoxPilot] Task edit failed: description flags conflict',
      projectNotInitialized: '[FoxPilot] Task edit failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task edit failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Task edit failed: task was not found',
      unchanged: '[FoxPilot] Task metadata unchanged',
      updated: '[FoxPilot] Task metadata updated',
    },
    taskShow: {
      helpDescription: 'Show detail and targets for a single task.',
      idRequired: '[FoxPilot] Task detail failed: id or external-id is required',
      projectNotInitialized: '[FoxPilot] Task detail failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task detail failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Task detail failed: task was not found',
      title: '[FoxPilot] Task detail',
      targetsTitle: '[FoxPilot] Task targets',
      noTargets: '- (none)',
      runsTitle: '[FoxPilot] Task run history',
      noRuns: '- No run history yet',
    },
    taskPushBeads: {
      helpDescription: 'Push one imported Beads task from the current project back to the local bd repository.',
      targetRequired: '[FoxPilot] Beads push failed: id, external-id, repository, or --all-repositories is required',
      idRequired: '[FoxPilot] Beads push failed: id or external-id is required',
      projectNotInitialized: '[FoxPilot] Beads push failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Beads push failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Beads push failed: task was not found',
      notImportedTask: '[FoxPilot] Beads push failed: task is not an imported Beads task',
      repositoryNotFound: '[FoxPilot] Beads push failed: repository was not found',
      repositoryNotInitialized: '[FoxPilot] Beads push failed: target repository has not initialized local Beads',
      pushFailed: '[FoxPilot] Beads push failed: unable to execute bd update',
      completed: '[FoxPilot] Beads push completed',
    },
    taskHistory: {
      helpDescription: 'Show full run history for a single task.',
      idRequired: '[FoxPilot] Task history failed: id or external-id is required',
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
    taskImportBeads: {
      helpDescription: 'Import Beads tasks from a local JSON snapshot.',
      fileRequired: '[FoxPilot] Beads import failed: file is required',
      fileReadFailed: '[FoxPilot] Beads import failed: unable to read snapshot file',
      invalidJson: '[FoxPilot] Beads import failed: invalid JSON format',
      invalidPayload: '[FoxPilot] Beads import failed: snapshot must be an array of tasks',
      projectNotInitialized: '[FoxPilot] Beads import failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Beads import failed: failed to initialize foxpilot.db',
      completed: '[FoxPilot] Beads import completed',
      rejectedTitle: '[FoxPilot] Rejected records',
    },
    taskSyncBeads: {
      helpDescription: 'Sync Beads tasks directly from bd list output in a selected repository.',
      repositoryRequired: '[FoxPilot] Local Beads sync failed: repository or --all-repositories is required',
      repositoryNotFound: '[FoxPilot] Local Beads sync failed: repository was not found',
      readFailed: '[FoxPilot] Local Beads sync failed: unable to read bd list output',
      invalidJson: '[FoxPilot] Local Beads sync failed: bd list output is not valid JSON',
      invalidPayload: '[FoxPilot] Local Beads sync failed: bd list output must be an array of tasks',
      projectNotInitialized: '[FoxPilot] Local Beads sync failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Local Beads sync failed: failed to initialize foxpilot.db',
      completed: '[FoxPilot] Local Beads sync completed',
      rejectedTitle: '[FoxPilot] Rejected records',
    },
    taskDiffBeads: {
      helpDescription: 'Preview the diff that a local Beads snapshot would produce.',
      fileRequired: '[FoxPilot] Beads diff preview failed: file, repository, or --all-repositories is required',
      fileReadFailed: '[FoxPilot] Beads diff preview failed: unable to read preview source',
      invalidJson: '[FoxPilot] Beads diff preview failed: preview source has invalid JSON format',
      invalidPayload: '[FoxPilot] Beads diff preview failed: preview source must be an array of tasks',
      repositoryNotFound: '[FoxPilot] Beads diff preview failed: repository was not found',
      projectNotInitialized: '[FoxPilot] Beads diff preview failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Beads diff preview failed: failed to initialize foxpilot.db',
      title: '[FoxPilot] Beads snapshot diff preview',
      detailsTitle: '[FoxPilot] Diff details',
      noChanges: '- No visible diff right now',
      rejectedTitle: '[FoxPilot] Rejected records',
    },
    taskExportBeads: {
      helpDescription: 'Export Beads sync tasks in the current project to a local JSON snapshot.',
      fileRequired: '[FoxPilot] Beads export failed: file is required',
      projectNotInitialized: '[FoxPilot] Beads export failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Beads export failed: failed to initialize foxpilot.db',
      writeFailed: '[FoxPilot] Beads export failed: failed to write snapshot file',
      completed: '[FoxPilot] Beads export completed',
      rejectedTitle: '[FoxPilot] Records not exported',
    },
    taskUpdateStatus: {
      helpDescription: 'Update the status of one task in the current project.',
      idRequired: '[FoxPilot] Task status update failed: id or external-id is required',
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
      idRequired: '[FoxPilot] Task executor update failed: id or external-id is required',
      executorRequired: '[FoxPilot] Task executor update failed: executor is invalid or missing',
      projectNotInitialized: '[FoxPilot] Task executor update failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task executor update failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Task executor update failed: task was not found',
      unchanged: '[FoxPilot] Task executor unchanged',
      updated: '[FoxPilot] Task executor updated',
    },
    taskUpdatePriority: {
      helpDescription: 'Update the priority of one task in the current project.',
      idRequired: '[FoxPilot] Task priority update failed: id or external-id is required',
      priorityRequired: '[FoxPilot] Task priority update failed: priority is invalid or missing',
      projectNotInitialized: '[FoxPilot] Task priority update failed: project is not initialized',
      dbBootstrapFailed: '[FoxPilot] Task priority update failed: failed to initialize foxpilot.db',
      taskNotFound: '[FoxPilot] Task priority update failed: task was not found',
      unchanged: '[FoxPilot] Task priority unchanged',
      updated: '[FoxPilot] Task priority updated',
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
    taskBeadsSummary: {
      helpDescription: '現在のプロジェクト内の Beads 同期タスク集計を表示します。',
      projectNotInitialized: '[FoxPilot] Beads 要約に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] Beads 要約に失敗しました: foxpilot.db の初期化に失敗しました',
      empty: '[FoxPilot] 現在のプロジェクトには Beads 同期タスクがありません',
      title: '[FoxPilot] Beads タスク要約',
    },
    taskList: {
      helpDescription: '現在のプロジェクトのタスク一覧を表示します。',
      projectNotInitialized: '[FoxPilot] タスクリストに失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスクリストに失敗しました: foxpilot.db の初期化に失敗しました',
      empty: '[FoxPilot] 条件に一致するタスクはありません',
      title: '[FoxPilot] タスクリスト',
    },
    taskNext: {
      helpDescription: '現在のプロジェクトで次に進めるべきタスクを 1 件表示します。',
      projectNotInitialized: '[FoxPilot] 次タスク取得に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] 次タスク取得に失敗しました: foxpilot.db の初期化に失敗しました',
      empty: '[FoxPilot] 現在進められるタスクはありません',
      title: '[FoxPilot] 次のタスク',
    },
    taskEdit: {
      helpDescription: '現在のプロジェクト内のタスクのタイトル・説明・種別を編集します。',
      idRequired: '[FoxPilot] タスク編集に失敗しました: id または external-id は必須です',
      titleRequired: '[FoxPilot] タスク編集に失敗しました: title は必須です',
      descriptionRequired: '[FoxPilot] タスク編集に失敗しました: description は必須です',
      noChangesSpecified: '[FoxPilot] タスク編集に失敗しました: 少なくとも 1 つの編集対象が必要です',
      conflictingDescription: '[FoxPilot] タスク編集に失敗しました: description 引数が競合しています',
      projectNotInitialized: '[FoxPilot] タスク編集に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク編集に失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] タスク編集に失敗しました: タスクが見つかりません',
      unchanged: '[FoxPilot] タスクメタデータは変化していません',
      updated: '[FoxPilot] タスクメタデータを更新しました',
    },
    taskShow: {
      helpDescription: '単一タスクの詳細と対象一覧を表示します。',
      idRequired: '[FoxPilot] タスク詳細に失敗しました: id または external-id は必須です',
      projectNotInitialized: '[FoxPilot] タスク詳細に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク詳細に失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] タスク詳細に失敗しました: タスクが見つかりません',
      title: '[FoxPilot] タスク詳細',
      targetsTitle: '[FoxPilot] タスク対象',
      noTargets: '- (none)',
      runsTitle: '[FoxPilot] タスク実行履歴',
      noRuns: '- 実行履歴はまだありません',
    },
    taskPushBeads: {
      helpDescription: '現在のプロジェクト内の単一 Beads 取り込みタスクをローカル bd リポジトリへ書き戻します。',
      targetRequired: '[FoxPilot] Beads 書き戻しに失敗しました: id、external-id、repository、--all-repositories のいずれかが必須です',
      idRequired: '[FoxPilot] Beads 書き戻しに失敗しました: id または external-id は必須です',
      projectNotInitialized: '[FoxPilot] Beads 書き戻しに失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] Beads 書き戻しに失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] Beads 書き戻しに失敗しました: タスクが見つかりません',
      notImportedTask: '[FoxPilot] Beads 書き戻しに失敗しました: タスクは Beads 取り込みタスクではありません',
      repositoryNotFound: '[FoxPilot] Beads 書き戻しに失敗しました: repository が見つかりません',
      repositoryNotInitialized: '[FoxPilot] Beads 書き戻しに失敗しました: 対象リポジトリでローカル Beads が未初期化です',
      pushFailed: '[FoxPilot] Beads 書き戻しに失敗しました: bd update を実行できません',
      completed: '[FoxPilot] Beads 書き戻しが完了しました',
    },
    taskHistory: {
      helpDescription: '単一タスクの完全な実行履歴を表示します。',
      idRequired: '[FoxPilot] タスク履歴に失敗しました: id または external-id は必須です',
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
    taskImportBeads: {
      helpDescription: 'ローカル JSON スナップショットから Beads タスクを取り込みます。',
      fileRequired: '[FoxPilot] Beads 取り込みに失敗しました: file は必須です',
      fileReadFailed: '[FoxPilot] Beads 取り込みに失敗しました: スナップショットファイルを読み込めません',
      invalidJson: '[FoxPilot] Beads 取り込みに失敗しました: JSON 形式が不正です',
      invalidPayload: '[FoxPilot] Beads 取り込みに失敗しました: スナップショットはタスク配列である必要があります',
      projectNotInitialized: '[FoxPilot] Beads 取り込みに失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] Beads 取り込みに失敗しました: foxpilot.db の初期化に失敗しました',
      completed: '[FoxPilot] Beads タスクの取り込みが完了しました',
      rejectedTitle: '[FoxPilot] 以下のレコードは拒否されました',
    },
    taskSyncBeads: {
      helpDescription: '選択したリポジトリの bd list 出力から Beads タスクを直接同期します。',
      repositoryRequired: '[FoxPilot] ローカル Beads 同期に失敗しました: repository または --all-repositories のどちらかが必須です',
      repositoryNotFound: '[FoxPilot] ローカル Beads 同期に失敗しました: repository が見つかりません',
      readFailed: '[FoxPilot] ローカル Beads 同期に失敗しました: bd list 出力を読み取れません',
      invalidJson: '[FoxPilot] ローカル Beads 同期に失敗しました: bd list 出力の JSON 形式が不正です',
      invalidPayload: '[FoxPilot] ローカル Beads 同期に失敗しました: bd list 出力はタスク配列である必要があります',
      projectNotInitialized: '[FoxPilot] ローカル Beads 同期に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] ローカル Beads 同期に失敗しました: foxpilot.db の初期化に失敗しました',
      completed: '[FoxPilot] ローカル Beads 同期が完了しました',
      rejectedTitle: '[FoxPilot] 以下のレコードは拒否されました',
    },
    taskDiffBeads: {
      helpDescription: 'ローカル Beads スナップショットを取り込んだ場合の差分を予覧します。',
      fileRequired: '[FoxPilot] Beads 差分予覧に失敗しました: file、repository、--all-repositories のいずれかが必須です',
      fileReadFailed: '[FoxPilot] Beads 差分予覧に失敗しました: 予覧元を読み込めません',
      invalidJson: '[FoxPilot] Beads 差分予覧に失敗しました: 予覧元の JSON 形式が不正です',
      invalidPayload: '[FoxPilot] Beads 差分予覧に失敗しました: 予覧元はタスク配列である必要があります',
      repositoryNotFound: '[FoxPilot] Beads 差分予覧に失敗しました: repository が見つかりません',
      projectNotInitialized: '[FoxPilot] Beads 差分予覧に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] Beads 差分予覧に失敗しました: foxpilot.db の初期化に失敗しました',
      title: '[FoxPilot] Beads スナップショット差分予覧',
      detailsTitle: '[FoxPilot] 差分詳細',
      noChanges: '- 現在表示できる差分はありません',
      rejectedTitle: '[FoxPilot] 以下のレコードは拒否されました',
    },
    taskExportBeads: {
      helpDescription: '現在のプロジェクト内の Beads 同期タスクをローカル JSON スナップショットとして書き出します。',
      fileRequired: '[FoxPilot] Beads 書き出しに失敗しました: file は必須です',
      projectNotInitialized: '[FoxPilot] Beads 書き出しに失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] Beads 書き出しに失敗しました: foxpilot.db の初期化に失敗しました',
      writeFailed: '[FoxPilot] Beads 書き出しに失敗しました: スナップショットファイルを書き込めません',
      completed: '[FoxPilot] Beads タスクの書き出しが完了しました',
      rejectedTitle: '[FoxPilot] 書き出せなかったレコード',
    },
    taskUpdateStatus: {
      helpDescription: '現在のプロジェクト内のタスク状態を更新します。',
      idRequired: '[FoxPilot] タスク状態更新に失敗しました: id または external-id は必須です',
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
      idRequired: '[FoxPilot] タスク実行者更新に失敗しました: id または external-id は必須です',
      executorRequired: '[FoxPilot] タスク実行者更新に失敗しました: executor が不正または不足しています',
      projectNotInitialized: '[FoxPilot] タスク実行者更新に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク実行者更新に失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] タスク実行者更新に失敗しました: タスクが見つかりません',
      unchanged: '[FoxPilot] タスク実行者は変化していません',
      updated: '[FoxPilot] タスク実行者を更新しました',
    },
    taskUpdatePriority: {
      helpDescription: '現在のプロジェクト内のタスク優先度を更新します。',
      idRequired: '[FoxPilot] タスク優先度更新に失敗しました: id または external-id は必須です',
      priorityRequired: '[FoxPilot] タスク優先度更新に失敗しました: priority が不正または不足しています',
      projectNotInitialized: '[FoxPilot] タスク優先度更新に失敗しました: プロジェクトが未初期化です',
      dbBootstrapFailed: '[FoxPilot] タスク優先度更新に失敗しました: foxpilot.db の初期化に失敗しました',
      taskNotFound: '[FoxPilot] タスク優先度更新に失敗しました: タスクが見つかりません',
      unchanged: '[FoxPilot] タスク優先度は変化していません',
      updated: '[FoxPilot] タスク優先度を更新しました',
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
