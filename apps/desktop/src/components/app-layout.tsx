import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowLeft,
  Blocks,
  Check,
  ChevronRight,
  FolderKanban,
  Globe,
  LayoutDashboard,
  ListTodo,
  MoonStar,
  Orbit,
  Plus,
  Settings2,
  SunMedium,
  Workflow,
} from 'lucide-react'
import {
  Button,
  Divider,
  Layout,
  List,
  Menu,
  Popover,
  Space,
  Tag,
  Typography,
  type MenuProps,
} from 'antd'

import { PageContent } from '@desktop/components/page-content.js'
import type { DesktopPageId } from '@desktop/lib/desktop-pages.js'
import type {
  DesktopInterfaceLanguage,
  DesktopLanguagePreference,
} from '@desktop/lib/desktop-language.js'
import type { getDesktopViewModel } from '@desktop/lib/mock-data.js'
import type {
  DesktopThemePreference,
  ResolvedDesktopTheme,
} from '@desktop/lib/desktop-preferences.js'
import { cn } from '@desktop/lib/utils.js'
import type { DesktopRuntimeStatus } from '@desktop/lib/tauri-status.js'

const { Sider, Content } = Layout
const { Text, Title, Paragraph } = Typography

type DesktopViewModel = ReturnType<typeof getDesktopViewModel>
type SettingsPanel = 'root' | 'language' | 'theme'

const navIcons: Record<DesktopPageId, ReactNode> = {
  dashboard: <LayoutDashboard className="size-4" />,
  workspace: <FolderKanban className="size-4" />,
  tasks: <ListTodo className="size-4" />,
  runs: <Workflow className="size-4" />,
  events: <Activity className="size-4" />,
  'control-plane': <Blocks className="size-4" />,
  health: <Orbit className="size-4" />,
}

const navGroups: Record<
  DesktopInterfaceLanguage,
  Array<{
    key: string
    label: string
    pages: DesktopPageId[]
  }>
> = {
  'zh-CN': [
    { key: 'workbench', label: '工作台', pages: ['dashboard', 'workspace', 'tasks'] },
    { key: 'execution', label: '执行', pages: ['runs', 'events'] },
    { key: 'control', label: '扩展与中控', pages: ['control-plane'] },
    { key: 'system', label: '系统', pages: ['health'] },
  ],
  'en-US': [
    { key: 'workbench', label: 'Workbench', pages: ['dashboard', 'workspace', 'tasks'] },
    { key: 'execution', label: 'Execution', pages: ['runs', 'events'] },
    { key: 'control', label: 'Extensions', pages: ['control-plane'] },
    { key: 'system', label: 'System', pages: ['health'] },
  ],
  'ja-JP': [
    { key: 'workbench', label: 'ワークベンチ', pages: ['dashboard', 'workspace', 'tasks'] },
    { key: 'execution', label: '実行', pages: ['runs', 'events'] },
    { key: 'control', label: '拡張と中枢', pages: ['control-plane'] },
    { key: 'system', label: 'システム', pages: ['health'] },
  ],
}

const sidebarQueueLabels: Record<DesktopInterfaceLanguage, string> = {
  'zh-CN': '近期焦点',
  'en-US': 'Recent focus',
  'ja-JP': '最近のフォーカス',
}

function getThemeIcon(theme: ResolvedDesktopTheme) {
  return theme === 'dark' ? MoonStar : SunMedium
}

function getWorkspaceName(root: string) {
  const normalized = root.replace(/\/+$/, '')
  const segments = normalized.split('/')
  return segments.at(-1) || root
}

function getRuntimeTagColor(runtimeStatus?: DesktopRuntimeStatus) {
  return runtimeStatus?.shell === 'tauri' ? 'success' : 'default'
}

export function AppLayout({
  currentPage = 'dashboard',
  languagePreference,
  onLanguageChange,
  onNavigate = () => {},
  onThemeChange,
  resolvedLanguage,
  resolvedTheme,
  runtimeStatus,
  themePreference,
  viewModel,
}: {
  currentPage?: DesktopPageId
  languagePreference: DesktopLanguagePreference
  onLanguageChange: (language: DesktopLanguagePreference) => void
  onNavigate?: (page: DesktopPageId) => void
  onThemeChange: (theme: DesktopThemePreference) => void
  resolvedLanguage: DesktopInterfaceLanguage
  resolvedTheme: ResolvedDesktopTheme
  runtimeStatus?: DesktopRuntimeStatus
  themePreference: DesktopThemePreference
  viewModel: DesktopViewModel
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>('root')
  const pageMeta = viewModel.pageMeta[currentPage]
  const workspaceName = useMemo(() => getWorkspaceName(viewModel.workspace.root), [viewModel])
  const ThemeIcon = getThemeIcon(resolvedTheme)

  const shellLabel =
    runtimeStatus?.shell === 'tauri' ? viewModel.shell.runtimeConnected : viewModel.shell.webPreview

  const groupedItems = useMemo(
    () =>
      navGroups[resolvedLanguage].map((group) => ({
        ...group,
        items: group.pages.map((pageId) => ({
          key: pageId,
          icon: navIcons[pageId],
          label: (
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">
                {viewModel.pageMeta[pageId].label}
              </span>
              <span className="truncate text-[11px] text-[color:var(--color-muted-foreground)]">
                {viewModel.pageMeta[pageId].description}
              </span>
            </span>
          ),
        })),
      })),
    [resolvedLanguage, viewModel.pageMeta],
  )

  const closeSettings = () => {
    setSettingsOpen(false)
    setSettingsPanel('root')
  }

  const settingsContent =
    settingsPanel === 'root' ? (
      <div className="foxpilot-settings-panel">
        <div className="foxpilot-settings-banner">
          <Text strong className="text-sm">
            {viewModel.shell.localModeLabel}
          </Text>
          <Paragraph className="!mb-0 !mt-1 text-sm !text-[color:var(--color-muted-foreground)]">
            {viewModel.shell.localModeDescription}
          </Paragraph>
        </div>
        <Divider className="!my-3 !border-[color:var(--color-border)]" />
        <SettingsRow
          icon={<Settings2 className="size-4" />}
          label={viewModel.shell.settingsMenuLabel}
          description={viewModel.shell.settingsMenuDescription}
        />
        <SettingsRow
          ariaLabel={`${viewModel.shell.languageMenuLabel} ${viewModel.shell.languageResolvedLabel}: ${resolvedLanguage}`}
          icon={<Globe className="size-4" />}
          label={viewModel.shell.languageMenuLabel}
          description={`${viewModel.shell.languageResolvedLabel}: ${resolvedLanguage}`}
          onClick={() => setSettingsPanel('language')}
          trailing={<ChevronRight className="size-4 text-[color:var(--color-muted-foreground)]" />}
        />
        <SettingsRow
          ariaLabel={`${viewModel.shell.themeMenuLabel} ${viewModel.shell.themeResolvedLabel}: ${resolvedTheme}`}
          icon={<ThemeIcon className="size-4" />}
          label={viewModel.shell.themeMenuLabel}
          description={`${viewModel.shell.themeResolvedLabel}: ${resolvedTheme}`}
          onClick={() => setSettingsPanel('theme')}
          trailing={<ChevronRight className="size-4 text-[color:var(--color-muted-foreground)]" />}
        />
      </div>
    ) : (
      <SettingsSubpanel
        backLabel={viewModel.shell.backLabel}
        title={
          settingsPanel === 'language'
            ? viewModel.shell.languageMenuLabel
            : viewModel.shell.themeMenuLabel
        }
        onBack={() => setSettingsPanel('root')}
      >
        {(settingsPanel === 'language'
          ? viewModel.shell.languageOptions.map((option) => ({
              key: option.value,
              label: option.label,
              active: option.value === languagePreference,
              description:
                option.value === resolvedLanguage
                  ? `${viewModel.shell.languageResolvedLabel}: ${resolvedLanguage}`
                  : undefined,
              onClick: () => {
                onLanguageChange(option.value)
                closeSettings()
              },
            }))
          : viewModel.shell.themeOptions.map((option) => ({
              key: option.value,
              label: option.label,
              active: option.value === themePreference,
              description:
                option.value === resolvedTheme
                  ? `${viewModel.shell.themeResolvedLabel}: ${resolvedTheme}`
                  : undefined,
              onClick: () => {
                onThemeChange(option.value)
                closeSettings()
              },
            }))
        ).map((item) => (
          <Button
            key={item.key}
            type="text"
            aria-pressed={item.active}
            className={cn(
              'foxpilot-settings-choice',
              item.active ? 'foxpilot-settings-choice-active' : undefined,
            )}
            onClick={item.onClick}
          >
            <span className="min-w-0 text-left">
              <span className="block text-sm font-medium text-[color:var(--color-foreground)]">
                {item.label}
              </span>
              {item.description ? (
                <span className="block text-sm text-[color:var(--color-muted-foreground)]">
                  {item.description}
                </span>
              ) : null}
            </span>
            {item.active ? <Check className="size-4 text-[color:var(--color-primary)]" /> : null}
          </Button>
        ))}
      </SettingsSubpanel>
    )

  return (
    <Layout className="min-h-screen bg-background">
      <Sider width={328} theme={resolvedTheme} className="foxpilot-shell-sider">
        <div className="foxpilot-shell-frame">
          <div className="foxpilot-shell-brand">
            <Text className="foxpilot-shell-product">{viewModel.shell.product}</Text>
            <Paragraph className="foxpilot-shell-subtitle">{viewModel.shell.subtitle}</Paragraph>
          </div>

          <Button
            block
            icon={<Plus className="size-4" />}
            size="large"
            type="default"
            className="foxpilot-shell-primary-button"
          >
            {viewModel.shell.primaryActionLabel}
          </Button>

          <section className="foxpilot-shell-section foxpilot-shell-section-compact">
            <Text className="foxpilot-shell-section-label">
              {viewModel.shell.workspaceSectionLabel}
            </Text>
            <button type="button" className="foxpilot-shell-workspace">
              <div className="foxpilot-shell-workspace-indicator" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{workspaceName}</div>
                <div className="mt-1 truncate text-xs text-[color:var(--color-muted-foreground)]">
                  {viewModel.workspace.profile} · {viewModel.workspace.executorStrategy}
                </div>
              </div>
              <Tag bordered={false} className="foxpilot-inline-tag">
                {viewModel.workspace.repositories}
              </Tag>
            </button>
          </section>

          <section className="foxpilot-shell-section foxpilot-shell-section-scroll">
            <nav aria-label={viewModel.shell.navigationLabel}>
              {groupedItems.map((group) => (
                <div key={group.key} className="foxpilot-nav-group">
                  <Text className="foxpilot-shell-section-label">{group.label}</Text>
                  <Menu
                    selectedKeys={[currentPage]}
                    mode="inline"
                    items={group.items as MenuProps['items']}
                    onClick={({ key }) => onNavigate(key as DesktopPageId)}
                    className="foxpilot-nav-menu"
                  />
                </div>
              ))}
            </nav>
          </section>

          <section className="foxpilot-shell-section foxpilot-shell-section-compact">
            <div className="flex items-center justify-between gap-3">
              <Text className="foxpilot-shell-section-label">
                {sidebarQueueLabels[resolvedLanguage]}
              </Text>
              <Text className="text-xs text-[color:var(--color-muted-foreground)]">
                {viewModel.focusQueue.length}
              </Text>
            </div>
            <List
              className="foxpilot-rail-list"
              split={false}
              dataSource={viewModel.focusQueue}
              renderItem={(item) => (
                <List.Item className="foxpilot-rail-list-item">
                  <button type="button" className="foxpilot-rail-item">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      <div className="mt-1 truncate text-[11px] text-[color:var(--color-muted-foreground)]">
                        {item.stage} · {item.platform}
                      </div>
                    </div>
                    <Tag
                      bordered={false}
                      className="foxpilot-inline-tag foxpilot-inline-tag-strong"
                    >
                      {item.priority}
                    </Tag>
                  </button>
                </List.Item>
              )}
            />
          </section>

          <div className="mt-auto pt-2">
            <Popover
              trigger="click"
              placement="topLeft"
              open={settingsOpen}
              onOpenChange={(open) => {
                setSettingsOpen(open)
                if (open) {
                  setSettingsPanel('root')
                }
              }}
              content={settingsContent}
              overlayClassName="foxpilot-settings-popover"
            >
              <Button
                block
                icon={<Settings2 className="size-4" />}
                size="large"
                type="text"
                className="foxpilot-shell-settings-button"
              >
                {viewModel.shell.settingsButtonLabel}
              </Button>
            </Popover>
          </div>
        </div>
      </Sider>

      <Layout className="bg-background">
        <Content className="foxpilot-main-content">
          <div className="foxpilot-main-frame">
            <header className="foxpilot-main-header">
              <div className="min-w-0">
                <Text className="foxpilot-main-eyebrow">{pageMeta.eyebrow}</Text>
                <Title level={1} className="foxpilot-main-title">
                  {pageMeta.label}
                </Title>
                <Paragraph className="foxpilot-main-description">{pageMeta.description}</Paragraph>
              </div>

              <div className="foxpilot-main-status">
                <Space wrap size={[8, 8]} className="justify-end">
                  <Tag bordered={false} className="foxpilot-inline-tag">
                    {viewModel.workspace.profile}
                  </Tag>
                  <Tag bordered={false} className="foxpilot-inline-tag">
                    {viewModel.workspace.executorStrategy}
                  </Tag>
                  <Tag
                    bordered={false}
                    color={getRuntimeTagColor(runtimeStatus)}
                    className="foxpilot-inline-tag"
                  >
                    {shellLabel}
                  </Tag>
                  <Tag bordered={false} className="foxpilot-inline-tag">
                    {runtimeStatus
                      ? viewModel.shell.connectedPlatforms(runtimeStatus.platformAdapters.length)
                      : viewModel.shell.openCliPreview}
                  </Tag>
                </Space>
              </div>
            </header>

            <PageContent page={currentPage} runtimeStatus={runtimeStatus} viewModel={viewModel} />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

function SettingsRow({
  ariaLabel,
  description,
  icon,
  label,
  onClick,
  trailing,
}: {
  ariaLabel?: string
  description?: string
  icon: ReactNode
  label: string
  onClick?: () => void
  trailing?: ReactNode
}) {
  return (
    <Button type="text" aria-label={ariaLabel} className="foxpilot-settings-row" onClick={onClick}>
      <span className="flex min-w-0 items-center gap-3 text-left">
        <span className="text-[color:var(--color-muted-foreground)]">{icon}</span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[color:var(--color-foreground)]">
            {label}
          </span>
          {description ? (
            <span className="block text-sm text-[color:var(--color-muted-foreground)]">
              {description}
            </span>
          ) : null}
        </span>
      </span>
      {trailing}
    </Button>
  )
}

function SettingsSubpanel({
  backLabel,
  children,
  onBack,
  title,
}: {
  backLabel: string
  children: ReactNode
  onBack: () => void
  title: string
}) {
  return (
    <div className="space-y-2">
      <Button
        type="text"
        className="foxpilot-settings-back"
        icon={<ArrowLeft className="size-4" />}
        onClick={onBack}
      >
        {backLabel}
      </Button>
      <Text className="foxpilot-shell-section-label">{title}</Text>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  )
}
