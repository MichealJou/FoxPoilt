import type { DesktopPageId } from '@desktop/ui/app/types.js'

export const desktopPageMeta: Record<
  DesktopPageId,
  {
    label: string
    description: string
    eyebrow: string
  }
> = {
  dashboard: {
    label: 'Dashboard',
    description: '聚合任务、运行、平台和风险确认的第一视图。',
    eyebrow: '总览',
  },
  workspace: {
    label: 'Workspace',
    description: '查看项目接管结果、仓库结构、profile 与 executor 解析。',
    eyebrow: '项目',
  },
  tasks: {
    label: 'Tasks',
    description: '聚合任务列表、优先级、来源和当前阶段交接。',
    eyebrow: '任务',
  },
  runs: {
    label: 'Runs',
    description: '查看设计、编码、验证等阶段的执行结果和交接链路。',
    eyebrow: '运行',
  },
  events: {
    label: 'Events',
    description: '展示事件时间线、触发原因和自动编排结果。',
    eyebrow: '事件',
  },
  'control-plane': {
    label: 'Control Plane',
    description: '统一管理多 agent 平台、skills 和 MCP 注册表。',
    eyebrow: '中控',
  },
  health: {
    label: 'Health',
    description: '统一查看 foundation、doctor、repair 和环境告警。',
    eyebrow: '健康',
  },
}

export const dashboardStats = [
  { label: '进行中任务', value: '18', delta: '+4 今日' },
  { label: '阻塞事项', value: '3', delta: '需人工确认' },
  { label: '活跃运行', value: '7', delta: '4 平台参与' },
  { label: '风险确认', value: '2', delta: '待批准' },
] as const

export const focusQueue = [
  { title: '桌面控制台首屏信息架构', priority: 'P0', platform: 'codex', stage: 'design' },
  { title: '任务列表 JSON 出口收口', priority: 'P1', platform: 'claude_code', stage: 'implement' },
  { title: 'doctor/repair 决策矩阵验证', priority: 'P1', platform: 'qoder', stage: 'verify' },
] as const

export const tasksTable = [
  { title: '实现 Init Wizard 预览', source: 'local', status: 'analyzing', owner: 'codex', priority: 'P0' },
  { title: '编排平台适配契约', source: 'beads', status: 'awaiting_plan_confirm', owner: 'claude_code', priority: 'P1' },
  { title: 'MCP 注册表修复入口', source: 'local', status: 'todo', owner: 'manual', priority: 'P2' },
  { title: '运行详情页布局策略', source: 'beads', status: 'implementing', owner: 'trae', priority: 'P1' },
] as const

export const runTimeline = [
  { stage: 'design', role: 'designer', platform: 'codex', status: 'success' },
  { stage: 'implement', role: 'coder', platform: 'claude_code', status: 'running' },
  { stage: 'verify', role: 'tester', platform: 'qoder', status: 'queued' },
  { stage: 'repair', role: 'fixer', platform: 'trae', status: 'idle' },
] as const

export const eventGroups = [
  { title: 'Beads 导入', count: 12, detail: '最近一次 sync-beads 在 09:42 完成。' },
  { title: '平台分派', count: 7, detail: '3 个任务在 design -> implement 之间完成交接。' },
  { title: '风险确认', count: 2, detail: '1 个 repair 动作需要人工批准后继续。' },
] as const

export const platformRegistry = [
  { name: 'Codex', role: '设计 / 分析', status: 'ready' },
  { name: 'Claude Code', role: '编码 / 重构', status: 'ready' },
  { name: 'Qoder', role: '验证 / 测试', status: 'degraded' },
  { name: 'Trae', role: '补丁 / 修复', status: 'unavailable' },
] as const

export const skillRegistry = [
  { name: 'brainstorming', scope: '设计前置', status: 'ready' },
  { name: 'architecture-designer', scope: '系统设计', status: 'ready' },
  { name: 'writing-plans', scope: '执行计划', status: 'ready' },
] as const

export const mcpRegistry = [
  { name: 'Figma', endpoint: 'design context', status: 'ready' },
  { name: 'GitHub', endpoint: 'repo / pr / issue', status: 'ready' },
  { name: 'Slack', endpoint: 'channel summary', status: 'degraded' },
] as const

export const healthIssues = [
  { title: 'Trae 平台不可用', severity: 'danger', detail: '未探测到可调用入口，当前 repair 阶段会回退 manual。' },
  { title: 'Slack MCP 降级', severity: 'warning', detail: '最近一次 health check 在拉取频道时超时。' },
] as const

export const workspaceSummary = {
  root: '/Users/program/code/foxpilot-workspace',
  profile: 'default',
  repositories: 3,
  executorStrategy: 'auto',
}
