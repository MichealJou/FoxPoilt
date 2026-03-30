import type { DesktopPageId } from '@desktop/lib/desktop-pages.js'
import type { DesktopInterfaceLanguage } from '@desktop/lib/desktop-language.js'

type DesktopPageMeta = {
  label: string
  description: string
  eyebrow: string
}

type DesktopViewModel = {
  shell: {
    product: string
    title: string
    subtitle: string
    navigationLabel: string
    primaryActionLabel: string
    workspaceSectionLabel: string
    navigationSectionLabel: string
    settingsButtonLabel: string
    localModeLabel: string
    localModeDescription: string
    settingsMenuLabel: string
    settingsMenuDescription: string
    languageMenuLabel: string
    themeMenuLabel: string
    backLabel: string
    languageLabel: string
    languageResolvedLabel: string
    languageOptions: Array<{ value: 'system' | DesktopInterfaceLanguage; label: string }>
    themeLabel: string
    themeResolvedLabel: string
    themeOptions: Array<{ value: 'system' | 'dark' | 'light'; label: string }>
    runtimeConnected: string
    webPreview: string
    connectedPlatforms: (count: number) => string
    openCliPreview: string
  }
  pageMeta: Record<DesktopPageId, DesktopPageMeta>
  dashboardStats: Array<{ label: string; value: string; delta: string }>
  focusQueueTitle: string
  focusQueueDescription: string
  anomalyTitle: string
  anomalyDescription: string
  focusQueue: Array<{ title: string; priority: string; platform: string; stage: string }>
  healthIssues: Array<{ title: string; severity: string; detail: string }>
  workspace: {
    title: string
    description: string
    scanTitle: string
    scanDescription: string
    root: string
    profile: string
    executorStrategy: string
    repositories: number
    fieldRoot: string
    fieldProfile: string
    fieldExecutor: string
    fieldRepositories: string
    scanSignals: string[]
  }
  tasks: {
    title: string
    description: string
    headers: [string, string, string, string, string]
    rows: Array<{ title: string; source: string; status: string; owner: string; priority: string }>
  }
  runs: {
    title: string
    description: string
    timeline: Array<{ stage: string; role: string; platform: string; status: string }>
  }
  events: {
    groups: Array<{ title: string; count: number; detail: string }>
  }
  controlPlane: {
    registries: Array<{
      title: string
      description: string
      items: Array<{ name: string; status: string; detail: string }>
    }>
  }
  health: {
    title: string
    description: string
    appearanceTitle: string
    appearanceDescription: string
    preferenceLabel: string
    resolvedLabel: string
    runtimeLabel: string
    runtimeDescription: string
    paletteTitle: string
    paletteDescription: string
    paletteChips: string[]
    suggestedActionsTitle: string
    suggestedActionsDescription: string
    suggestedActions: string[]
  }
  context: {
    currentControl: string
    quickActions: string
    projectRoot: string
    actions: Record<DesktopPageId, string[]>
    fieldProfile: string
    fieldExecutor: string
    fieldRepositories: string
    preferencesTitle: string
    preferencesDescription: string
    currentLanguagePreference: string
    currentThemePreference: string
    currentLanguage: string
    currentTheme: string
  }
}

const sharedStatus = {
  platforms: [
    { name: 'Codex', status: 'ready' },
    { name: 'Claude Code', status: 'ready' },
    { name: 'Qoder', status: 'degraded' },
    { name: 'Trae', status: 'unavailable' },
  ],
  skills: [
    { name: 'brainstorming', status: 'ready' },
    { name: 'architecture-designer', status: 'ready' },
    { name: 'writing-plans', status: 'ready' },
  ],
  mcps: [
    { name: 'Figma', status: 'ready' },
    { name: 'GitHub', status: 'ready' },
    { name: 'Slack', status: 'degraded' },
  ],
} as const

const desktopViewModels: Record<DesktopInterfaceLanguage, DesktopViewModel> = {
  'zh-CN': {
    shell: {
      product: 'FoxPilot',
      title: 'Desktop Console',
      subtitle: '本地 AI 协作中控，统一管理任务、平台、Skills 与 MCP。',
      navigationLabel: 'FoxPilot 主导航',
      primaryActionLabel: '新建任务',
      workspaceSectionLabel: '工作区',
      navigationSectionLabel: '导航',
      settingsButtonLabel: '设置',
      localModeLabel: '本地模式',
      localModeDescription: '当前无需登录，后续可在这里接入账号。',
      settingsMenuLabel: '设置',
      settingsMenuDescription: '管理桌面端显示与偏好。',
      languageMenuLabel: '语言',
      themeMenuLabel: '主题',
      backLabel: '返回',
      languageLabel: '语言',
      languageResolvedLabel: '当前语言',
      languageOptions: [
        { value: 'system', label: '跟随系统' },
        { value: 'zh-CN', label: '中文' },
        { value: 'en-US', label: 'English' },
        { value: 'ja-JP', label: '日本語' },
      ],
      themeLabel: '主题',
      themeResolvedLabel: '当前主题',
      themeOptions: [
        { value: 'system', label: '跟随系统' },
        { value: 'dark', label: '深色' },
        { value: 'light', label: '浅色' },
      ],
      runtimeConnected: 'Tauri 已连接',
      webPreview: 'Web 预览模式',
      connectedPlatforms: (count) => `平台 ${count}`,
      openCliPreview: '打开 CLI 预览',
    },
    pageMeta: {
      dashboard: { label: '总览', description: '先看风险、焦点和运行密度。', eyebrow: 'Dashboard' },
      workspace: {
        label: '工作区',
        description: '项目接管、Profile 与执行策略。',
        eyebrow: 'Workspace',
      },
      tasks: { label: '任务', description: '高密度任务表、状态和来源。', eyebrow: 'Tasks' },
      runs: { label: '运行', description: '阶段、角色和平台交接链路。', eyebrow: 'Runs' },
      events: { label: '事件', description: '按来源和结果收拢事件时间线。', eyebrow: 'Events' },
      'control-plane': {
        label: '中控',
        description: '统一管理平台、Skills 和 MCP。',
        eyebrow: 'Control Plane',
      },
      health: { label: '健康', description: 'Doctor、Repair 和环境告警。', eyebrow: 'Health' },
    },
    dashboardStats: [
      { label: '进行中任务', value: '18', delta: '+4 今日' },
      { label: '阻塞事项', value: '3', delta: '需人工确认' },
      { label: '活跃运行', value: '7', delta: '4 平台参与' },
      { label: '风险确认', value: '2', delta: '待批准' },
    ],
    focusQueueTitle: '焦点队列',
    focusQueueDescription: '按优先级、阻塞性和阶段交接计算的当前最重要事项。',
    anomalyTitle: '异常入口',
    anomalyDescription: '把风险、失败和待确认动作直接拉到首屏。',
    focusQueue: [
      { title: '桌面控制台首屏信息架构', priority: 'P0', platform: 'codex', stage: 'design' },
      {
        title: '任务列表 JSON 出口收口',
        priority: 'P1',
        platform: 'claude_code',
        stage: 'implement',
      },
      { title: 'doctor/repair 决策矩阵验证', priority: 'P1', platform: 'qoder', stage: 'verify' },
    ],
    healthIssues: [
      {
        title: 'Trae 平台不可用',
        severity: 'danger',
        detail: '未探测到可调用入口，repair 阶段当前回退 manual。',
      },
      {
        title: 'Slack MCP 降级',
        severity: 'warning',
        detail: '最近一次健康检查在频道拉取时超时。',
      },
    ],
    workspace: {
      title: '当前项目',
      description: '项目级接管结果、Profile 与执行策略快照。',
      scanTitle: '扫描信号',
      scanDescription: '初始化推荐引擎与平台解析依赖的关键信号。',
      root: '/Users/program/code/foxpilot-workspace',
      profile: 'default',
      executorStrategy: 'auto',
      repositories: 3,
      fieldRoot: '根目录',
      fieldProfile: 'Profile',
      fieldExecutor: '执行策略',
      fieldRepositories: '仓库数',
      scanSignals: [
        'package.json',
        'pnpm-lock.yaml',
        'turbo.json',
        'vitest.config.ts',
        'docs/specs',
        'src-tauri',
      ],
    },
    tasks: {
      title: '任务中心',
      description: '以表格优先承接高密度筛选、排序和状态判断。',
      headers: ['名称', '来源', '状态', '平台', '优先级'],
      rows: [
        {
          title: '实现 Init Wizard 预览',
          source: 'local',
          status: 'analyzing',
          owner: 'codex',
          priority: 'P0',
        },
        {
          title: '编排平台适配契约',
          source: 'beads',
          status: 'awaiting_plan_confirm',
          owner: 'claude_code',
          priority: 'P1',
        },
        {
          title: 'MCP 注册表修复入口',
          source: 'local',
          status: 'todo',
          owner: 'manual',
          priority: 'P2',
        },
        {
          title: '运行详情页布局策略',
          source: 'beads',
          status: 'implementing',
          owner: 'trae',
          priority: 'P1',
        },
      ],
    },
    runs: {
      title: '运行详情概览',
      description: '按阶段和角色展示多平台交接过程。',
      timeline: [
        { stage: 'design', role: 'designer', platform: 'codex', status: 'success' },
        { stage: 'implement', role: 'coder', platform: 'claude_code', status: 'running' },
        { stage: 'verify', role: 'tester', platform: 'qoder', status: 'queued' },
        { stage: 'repair', role: 'fixer', platform: 'trae', status: 'idle' },
      ],
    },
    events: {
      groups: [
        { title: 'Beads 导入', count: 12, detail: '最近一次 sync-beads 在 09:42 完成。' },
        { title: '平台分派', count: 7, detail: '3 个任务完成 design -> implement 交接。' },
        { title: '风险确认', count: 2, detail: '1 个 repair 动作仍需人工批准。' },
      ],
    },
    controlPlane: {
      registries: [
        {
          title: 'Platforms',
          description: '多 agent 平台按阶段和角色能力纳入中控。',
          items: sharedStatus.platforms.map((item) => ({
            name: item.name,
            status: item.status,
            detail: '平台适配器与能力矩阵已接入。',
          })),
        },
        {
          title: 'Skills',
          description: '供阶段模板与动作协议引用的技能集合。',
          items: sharedStatus.skills.map((item) => ({
            name: item.name,
            status: item.status,
            detail: '技能元数据和健康状态已聚合。',
          })),
        },
        {
          title: 'MCP',
          description: '统一观察、诊断和后续修复各类 MCP 入口。',
          items: sharedStatus.mcps.map((item) => ({
            name: item.name,
            status: item.status,
            detail: '传输方式、端点和状态已纳入中控。',
          })),
        },
      ],
    },
    health: {
      title: 'Doctor / Repair',
      description: 'Foundation、绑定和平台探测统一进入健康决策矩阵。',
      appearanceTitle: '显示与偏好',
      appearanceDescription: '语言、主题和运行环境在这里形成统一的桌面体验反馈。',
      preferenceLabel: '偏好',
      resolvedLabel: '生效结果',
      runtimeLabel: '运行模式',
      runtimeDescription: '桌面端优先展示真实壳状态，Web 预览只作为开发兜底。',
      paletteTitle: '视觉方向',
      paletteDescription: '当前界面采用偏 Codex Desktop 的深色中控台语气。',
      paletteChips: ['深色控制台', '青蓝强调色', '高密度信息卡片'],
      suggestedActionsTitle: '建议动作',
      suggestedActionsDescription: '把常用修复入口压成动作面，减少 CLI 记忆负担。',
      suggestedActions: ['运行 foundation doctor', '刷新 Skills 注册表', '重新探测 Trae 平台'],
    },
    context: {
      currentControl: '当前接管',
      quickActions: '快捷动作',
      projectRoot: '项目根目录',
      actions: {
        dashboard: ['查看焦点队列', '打开风险确认', '进入最新运行'],
        workspace: ['重新扫描项目', '查看 Profile 建议', '打开 project.json'],
        tasks: ['创建任务', '筛选阻塞任务', '查看下一任务'],
        runs: ['打开运行详情', '查看阶段交接', '导出执行摘要'],
        events: ['按来源筛选', '查看 hooks 结果', '导出时间线'],
        'control-plane': ['新增平台绑定', '刷新 Skills', '修复 MCP'],
        health: ['运行 doctor', '运行 repair', '导出健康报告'],
      },
      fieldProfile: 'Profile',
      fieldExecutor: '执行策略',
      fieldRepositories: '仓库数',
      preferencesTitle: '显示偏好',
      preferencesDescription: '主题和语言偏好会在桌面端本地记忆。',
      currentLanguagePreference: '语言偏好',
      currentThemePreference: '主题偏好',
      currentLanguage: '当前语言',
      currentTheme: '当前主题',
    },
  },
  'en-US': {
    shell: {
      product: 'FoxPilot',
      title: 'Desktop Console',
      subtitle: 'A local AI control plane for tasks, platforms, skills, and MCP.',
      navigationLabel: 'FoxPilot main navigation',
      primaryActionLabel: 'New task',
      workspaceSectionLabel: 'Workspace',
      navigationSectionLabel: 'Navigation',
      settingsButtonLabel: 'Settings',
      localModeLabel: 'Local mode',
      localModeDescription: 'No sign-in is required yet. Account access can be added here later.',
      settingsMenuLabel: 'Settings',
      settingsMenuDescription: 'Manage desktop display preferences.',
      languageMenuLabel: 'Language',
      themeMenuLabel: 'Theme',
      backLabel: 'Back',
      languageLabel: 'Language',
      languageResolvedLabel: 'Resolved language',
      languageOptions: [
        { value: 'system', label: 'Follow system' },
        { value: 'zh-CN', label: '中文' },
        { value: 'en-US', label: 'English' },
        { value: 'ja-JP', label: '日本語' },
      ],
      themeLabel: 'Theme',
      themeResolvedLabel: 'Resolved theme',
      themeOptions: [
        { value: 'system', label: 'Follow system' },
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
      ],
      runtimeConnected: 'Tauri connected',
      webPreview: 'Web preview',
      connectedPlatforms: (count) => `${count} platforms`,
      openCliPreview: 'Open CLI preview',
    },
    pageMeta: {
      dashboard: {
        label: 'Dashboard',
        description: 'See risk, focus, and runtime density first.',
        eyebrow: 'Dashboard',
      },
      workspace: {
        label: 'Workspace',
        description: 'Project takeover, profile, and execution strategy.',
        eyebrow: 'Workspace',
      },
      tasks: {
        label: 'Tasks',
        description: 'Dense task table with source, status, and owner.',
        eyebrow: 'Tasks',
      },
      runs: { label: 'Runs', description: 'Stage, role, and platform handoffs.', eyebrow: 'Runs' },
      events: {
        label: 'Events',
        description: 'Timeline grouped by source and result.',
        eyebrow: 'Events',
      },
      'control-plane': {
        label: 'Control Plane',
        description: 'Manage platforms, skills, and MCP in one place.',
        eyebrow: 'Control Plane',
      },
      health: {
        label: 'Health',
        description: 'Doctor, repair, and environment alerts.',
        eyebrow: 'Health',
      },
    },
    dashboardStats: [
      { label: 'Active tasks', value: '18', delta: '+4 today' },
      { label: 'Blocked items', value: '3', delta: 'Need review' },
      { label: 'Live runs', value: '7', delta: '4 platforms active' },
      { label: 'Risk checks', value: '2', delta: 'Pending approval' },
    ],
    focusQueueTitle: 'Focus Queue',
    focusQueueDescription: 'Current priority stack scored by urgency, blockage, and stage handoff.',
    anomalyTitle: 'Alerts',
    anomalyDescription: 'Surface failures, risks, and confirmations on the first screen.',
    focusQueue: [
      {
        title: 'Design dashboard information architecture',
        priority: 'P0',
        platform: 'codex',
        stage: 'design',
      },
      {
        title: 'Finalize task list JSON output',
        priority: 'P1',
        platform: 'claude_code',
        stage: 'implement',
      },
      {
        title: 'Validate doctor/repair matrix',
        priority: 'P1',
        platform: 'qoder',
        stage: 'verify',
      },
    ],
    healthIssues: [
      {
        title: 'Trae platform unavailable',
        severity: 'danger',
        detail: 'No callable entry was detected, so repair falls back to manual.',
      },
      {
        title: 'Slack MCP degraded',
        severity: 'warning',
        detail: 'The latest health check timed out while fetching a channel.',
      },
    ],
    workspace: {
      title: 'Current project',
      description: 'Project takeover result, profile, and execution snapshot.',
      scanTitle: 'Scan signals',
      scanDescription: 'Signals used by the init recommendation engine and platform resolution.',
      root: '/Users/program/code/foxpilot-workspace',
      profile: 'default',
      executorStrategy: 'auto',
      repositories: 3,
      fieldRoot: 'Root',
      fieldProfile: 'Profile',
      fieldExecutor: 'Execution',
      fieldRepositories: 'Repositories',
      scanSignals: [
        'package.json',
        'pnpm-lock.yaml',
        'turbo.json',
        'vitest.config.ts',
        'docs/specs',
        'src-tauri',
      ],
    },
    tasks: {
      title: 'Task center',
      description: 'A dense table-first view for filtering, sorting, and triage.',
      headers: ['Title', 'Source', 'Status', 'Platform', 'Priority'],
      rows: [
        {
          title: 'Implement Init Wizard preview',
          source: 'local',
          status: 'analyzing',
          owner: 'codex',
          priority: 'P0',
        },
        {
          title: 'Define platform adapter contract',
          source: 'beads',
          status: 'awaiting_plan_confirm',
          owner: 'claude_code',
          priority: 'P1',
        },
        {
          title: 'Repair MCP registry entry',
          source: 'local',
          status: 'todo',
          owner: 'manual',
          priority: 'P2',
        },
        {
          title: 'Refine run detail layout policy',
          source: 'beads',
          status: 'implementing',
          owner: 'trae',
          priority: 'P1',
        },
      ],
    },
    runs: {
      title: 'Run overview',
      description: 'Trace handoffs across stages and roles.',
      timeline: [
        { stage: 'design', role: 'designer', platform: 'codex', status: 'success' },
        { stage: 'implement', role: 'coder', platform: 'claude_code', status: 'running' },
        { stage: 'verify', role: 'tester', platform: 'qoder', status: 'queued' },
        { stage: 'repair', role: 'fixer', platform: 'trae', status: 'idle' },
      ],
    },
    events: {
      groups: [
        { title: 'Beads imports', count: 12, detail: 'The latest sync-beads finished at 09:42.' },
        {
          title: 'Platform assignments',
          count: 7,
          detail: '3 tasks completed the design -> implement handoff.',
        },
        {
          title: 'Risk confirmations',
          count: 2,
          detail: '1 repair action is still waiting for approval.',
        },
      ],
    },
    controlPlane: {
      registries: [
        {
          title: 'Platforms',
          description: 'Agent platforms grouped by stage and role capability.',
          items: sharedStatus.platforms.map((item) => ({
            name: item.name,
            status: item.status,
            detail: 'Adapter status and capability matrix are available.',
          })),
        },
        {
          title: 'Skills',
          description: 'Skill inventory referenced by stage templates and action protocols.',
          items: sharedStatus.skills.map((item) => ({
            name: item.name,
            status: item.status,
            detail: 'Metadata and health signals are aggregated.',
          })),
        },
        {
          title: 'MCP',
          description: 'Observe, diagnose, and later repair MCP entry points from one page.',
          items: sharedStatus.mcps.map((item) => ({
            name: item.name,
            status: item.status,
            detail: 'Transport, endpoint, and status are visible here.',
          })),
        },
      ],
    },
    health: {
      title: 'Doctor / Repair',
      description: 'Foundation, bindings, and platform detection share one health matrix.',
      appearanceTitle: 'Display & preferences',
      appearanceDescription:
        'Language, theme, and runtime state feed a single desktop experience layer.',
      preferenceLabel: 'Preference',
      resolvedLabel: 'Resolved',
      runtimeLabel: 'Runtime mode',
      runtimeDescription:
        'The desktop shell is the primary mode, while the web preview remains a development fallback.',
      paletteTitle: 'Visual direction',
      paletteDescription: 'The interface now leans into a Codex-like dark control console.',
      paletteChips: ['Dark console', 'Cyan accent', 'Dense cards'],
      suggestedActionsTitle: 'Suggested actions',
      suggestedActionsDescription:
        'Promote common fixes into the action layer and reduce CLI recall.',
      suggestedActions: [
        'Run foundation doctor',
        'Refresh skill registry',
        'Re-detect Trae platform',
      ],
    },
    context: {
      currentControl: 'Current takeover',
      quickActions: 'Quick actions',
      projectRoot: 'Project root',
      actions: {
        dashboard: ['Open focus queue', 'Review risk confirmations', 'Jump to latest run'],
        workspace: ['Rescan project', 'Inspect profile recommendation', 'Open project.json'],
        tasks: ['Create task', 'Filter blocked tasks', 'Find next task'],
        runs: ['Open run detail', 'Inspect handoff chain', 'Export summary'],
        events: ['Filter by source', 'Inspect hooks', 'Export timeline'],
        'control-plane': ['Add platform binding', 'Refresh skills', 'Repair MCP'],
        health: ['Run doctor', 'Run repair', 'Export health report'],
      },
      fieldProfile: 'Profile',
      fieldExecutor: 'Execution',
      fieldRepositories: 'Repositories',
      preferencesTitle: 'Display preferences',
      preferencesDescription: 'Theme and language are remembered locally in the desktop app.',
      currentLanguagePreference: 'Language preference',
      currentThemePreference: 'Theme preference',
      currentLanguage: 'Language',
      currentTheme: 'Theme',
    },
  },
  'ja-JP': {
    shell: {
      product: 'FoxPilot',
      title: 'Desktop Console',
      subtitle: 'タスク、プラットフォーム、Skills、MCP をまとめるローカル制御面。',
      navigationLabel: 'FoxPilot メインナビゲーション',
      primaryActionLabel: '新しいタスク',
      workspaceSectionLabel: 'ワークスペース',
      navigationSectionLabel: 'ナビゲーション',
      settingsButtonLabel: '設定',
      localModeLabel: 'ローカルモード',
      localModeDescription: '現時点ではログイン不要です。将来ここでアカウント連携できます。',
      settingsMenuLabel: '設定',
      settingsMenuDescription: 'デスクトップの表示設定を管理します。',
      languageMenuLabel: '言語',
      themeMenuLabel: 'テーマ',
      backLabel: '戻る',
      languageLabel: '言語',
      languageResolvedLabel: '現在の言語',
      languageOptions: [
        { value: 'system', label: 'システムに従う' },
        { value: 'zh-CN', label: '中文' },
        { value: 'en-US', label: 'English' },
        { value: 'ja-JP', label: '日本語' },
      ],
      themeLabel: 'テーマ',
      themeResolvedLabel: '現在のテーマ',
      themeOptions: [
        { value: 'system', label: 'システムに従う' },
        { value: 'dark', label: 'ダーク' },
        { value: 'light', label: 'ライト' },
      ],
      runtimeConnected: 'Tauri 接続済み',
      webPreview: 'Web プレビュー',
      connectedPlatforms: (count) => `プラットフォーム ${count}`,
      openCliPreview: 'CLI プレビューを開く',
    },
    pageMeta: {
      dashboard: {
        label: 'ダッシュボード',
        description: 'リスク、焦点、実行密度を先に確認。',
        eyebrow: 'Dashboard',
      },
      workspace: {
        label: 'ワークスペース',
        description: 'プロジェクト接管、Profile、実行戦略。',
        eyebrow: 'Workspace',
      },
      tasks: { label: 'タスク', description: '高密度なタスク表と状態一覧。', eyebrow: 'Tasks' },
      runs: {
        label: '実行',
        description: 'ステージ、ロール、プラットフォームの引き継ぎ。',
        eyebrow: 'Runs',
      },
      events: {
        label: 'イベント',
        description: 'ソース別に整理されたタイムライン。',
        eyebrow: 'Events',
      },
      'control-plane': {
        label: '制御面',
        description: 'Platforms、Skills、MCP を一元管理。',
        eyebrow: 'Control Plane',
      },
      health: { label: 'ヘルス', description: 'Doctor、Repair、環境アラート。', eyebrow: 'Health' },
    },
    dashboardStats: [
      { label: '進行中タスク', value: '18', delta: '本日 +4' },
      { label: 'ブロック項目', value: '3', delta: '確認待ち' },
      { label: '実行中セッション', value: '7', delta: '4 プラットフォーム' },
      { label: 'リスク確認', value: '2', delta: '承認待ち' },
    ],
    focusQueueTitle: 'フォーカスキュー',
    focusQueueDescription: '優先度、ブロック性、ステージ引き継ぎで計算した現在の最重要項目。',
    anomalyTitle: 'アラート',
    anomalyDescription: '失敗、リスク、確認待ちを最初の画面に集約。',
    focusQueue: [
      {
        title: 'デスクトップ初期画面の情報設計',
        priority: 'P0',
        platform: 'codex',
        stage: 'design',
      },
      {
        title: 'タスク一覧 JSON 出力の収束',
        priority: 'P1',
        platform: 'claude_code',
        stage: 'implement',
      },
      { title: 'doctor/repair 行列の検証', priority: 'P1', platform: 'qoder', stage: 'verify' },
    ],
    healthIssues: [
      {
        title: 'Trae プラットフォームが利用不可',
        severity: 'danger',
        detail: '呼び出し可能な入口が見つからず、repair は manual にフォールバックします。',
      },
      {
        title: 'Slack MCP が劣化',
        severity: 'warning',
        detail: '最新のヘルスチェックでチャンネル取得がタイムアウトしました。',
      },
    ],
    workspace: {
      title: '現在のプロジェクト',
      description: '接管結果、Profile、実行戦略のスナップショット。',
      scanTitle: 'スキャンシグナル',
      scanDescription: 'init 推薦エンジンとプラットフォーム解析が参照する信号。',
      root: '/Users/program/code/foxpilot-workspace',
      profile: 'default',
      executorStrategy: 'auto',
      repositories: 3,
      fieldRoot: 'ルート',
      fieldProfile: 'Profile',
      fieldExecutor: '実行戦略',
      fieldRepositories: 'リポジトリ数',
      scanSignals: [
        'package.json',
        'pnpm-lock.yaml',
        'turbo.json',
        'vitest.config.ts',
        'docs/specs',
        'src-tauri',
      ],
    },
    tasks: {
      title: 'タスクセンター',
      description: '高密度の一覧・絞り込み・並び替えに最適化した表形式。',
      headers: ['名称', 'ソース', '状態', 'プラットフォーム', '優先度'],
      rows: [
        {
          title: 'Init Wizard プレビュー実装',
          source: 'local',
          status: 'analyzing',
          owner: 'codex',
          priority: 'P0',
        },
        {
          title: 'プラットフォーム契約の定義',
          source: 'beads',
          status: 'awaiting_plan_confirm',
          owner: 'claude_code',
          priority: 'P1',
        },
        {
          title: 'MCP レジストリ修復入口',
          source: 'local',
          status: 'todo',
          owner: 'manual',
          priority: 'P2',
        },
        {
          title: '実行詳細レイアウト整理',
          source: 'beads',
          status: 'implementing',
          owner: 'trae',
          priority: 'P1',
        },
      ],
    },
    runs: {
      title: '実行概要',
      description: 'ステージとロールを横断して引き継ぎを確認。',
      timeline: [
        { stage: 'design', role: 'designer', platform: 'codex', status: 'success' },
        { stage: 'implement', role: 'coder', platform: 'claude_code', status: 'running' },
        { stage: 'verify', role: 'tester', platform: 'qoder', status: 'queued' },
        { stage: 'repair', role: 'fixer', platform: 'trae', status: 'idle' },
      ],
    },
    events: {
      groups: [
        {
          title: 'Beads 取り込み',
          count: 12,
          detail: '最新の sync-beads は 09:42 に完了しました。',
        },
        {
          title: 'プラットフォーム割り当て',
          count: 7,
          detail: '3 件のタスクが design -> implement を完了しました。',
        },
        { title: 'リスク確認', count: 2, detail: 'repair アクション 1 件がまだ承認待ちです。' },
      ],
    },
    controlPlane: {
      registries: [
        {
          title: 'Platforms',
          description: 'ステージとロール能力で整理された agent platform 一覧。',
          items: sharedStatus.platforms.map((item) => ({
            name: item.name,
            status: item.status,
            detail: 'アダプタ状態と能力行列を確認できます。',
          })),
        },
        {
          title: 'Skills',
          description: 'ステージテンプレートとアクションプロトコルが参照する技能集合。',
          items: sharedStatus.skills.map((item) => ({
            name: item.name,
            status: item.status,
            detail: 'メタデータとヘルス状態を集約しています。',
          })),
        },
        {
          title: 'MCP',
          description: '各 MCP 入口を観測・診断し、後続で修復までつなげます。',
          items: sharedStatus.mcps.map((item) => ({
            name: item.name,
            status: item.status,
            detail: 'トランスポート、エンドポイント、状態を表示します。',
          })),
        },
      ],
    },
    health: {
      title: 'Doctor / Repair',
      description: 'Foundation、binding、platform detection を同じヘルスマトリクスで扱います。',
      appearanceTitle: '表示と設定',
      appearanceDescription: '言語、テーマ、実行状態をまとめてデスクトップ体験に反映します。',
      preferenceLabel: '設定値',
      resolvedLabel: '現在の結果',
      runtimeLabel: '実行モード',
      runtimeDescription:
        'デスクトップシェルを主導線にしつつ、Web プレビューを開発時のフォールバックとして扱います。',
      paletteTitle: 'ビジュアル方針',
      paletteDescription: 'Codex Desktop に近いダークなコントロールコンソールを基調にしています。',
      paletteChips: ['ダークコンソール', 'シアンアクセント', '高密度カード'],
      suggestedActionsTitle: '推奨アクション',
      suggestedActionsDescription: 'よく使う修復入口を前面に出し、CLI の記憶負担を下げます。',
      suggestedActions: ['foundation doctor を実行', 'Skills レジストリを再読込', 'Trae を再検出'],
    },
    context: {
      currentControl: '現在の接管',
      quickActions: 'クイックアクション',
      projectRoot: 'プロジェクトルート',
      actions: {
        dashboard: ['フォーカスキューを開く', 'リスク確認を見る', '最新実行へ移動'],
        workspace: ['プロジェクトを再スキャン', 'Profile 推薦を確認', 'project.json を開く'],
        tasks: ['タスク作成', 'ブロックされたタスクを絞り込む', '次のタスクを探す'],
        runs: ['実行詳細を開く', '引き継ぎチェーンを見る', '要約をエクスポート'],
        events: ['ソースで絞り込む', 'hooks を確認', 'タイムラインを書き出す'],
        'control-plane': ['プラットフォーム binding 追加', 'Skills 更新', 'MCP 修復'],
        health: ['doctor 実行', 'repair 実行', 'ヘルスレポート出力'],
      },
      fieldProfile: 'Profile',
      fieldExecutor: '実行戦略',
      fieldRepositories: 'リポジトリ数',
      preferencesTitle: '表示設定',
      preferencesDescription: 'テーマと言語設定はデスクトップでローカル保存されます。',
      currentLanguagePreference: '言語設定',
      currentThemePreference: 'テーマ設定',
      currentLanguage: '現在の言語',
      currentTheme: '現在のテーマ',
    },
  },
}

export function getDesktopViewModel(language: DesktopInterfaceLanguage): DesktopViewModel {
  return desktopViewModels[language]
}
