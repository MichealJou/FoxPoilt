import { Command, FileStack, ShieldCheck } from 'lucide-react'

import { Badge } from '@desktop/components/ui/badge.js'
import { Button } from '@desktop/components/ui/button.js'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@desktop/components/ui/card.js'
import { desktopPageMeta, workspaceSummary } from '@desktop/lib/mock-data.js'
import type { DesktopPageId } from '@desktop/lib/desktop-pages.js'

const panelActions: Record<DesktopPageId, string[]> = {
  dashboard: ['查看 Focus Queue', '打开风险确认', '进入最新运行'],
  workspace: ['重新扫描项目', '查看 profile 建议', '打开 project.json'],
  tasks: ['创建任务', '筛选阻塞任务', '查看下一任务'],
  runs: ['打开运行详情', '查看阶段交接', '导出执行摘要'],
  events: ['按来源筛选', '查看 hooks 结果', '导出时间线'],
  'control-plane': ['新增平台绑定', '刷新 Skills', '修复 MCP'],
  health: ['运行 doctor', '运行 repair', '导出健康报告'],
}

export function ContextPanel({ page }: { page: DesktopPageId }) {
  return (
    <div data-testid="context-panel" className="flex h-full flex-col gap-4">
      <Card>
        <CardHeader>
          <CardDescription>{desktopPageMeta[page].eyebrow}</CardDescription>
          <CardTitle>{desktopPageMeta[page].label}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {desktopPageMeta[page].description}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-primary" />
            当前接管
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Profile</span>
            <Badge>{workspaceSummary.profile}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Executor</span>
            <Badge variant="outline">{workspaceSummary.executorStrategy}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Repositories</span>
            <span>{workspaceSummary.repositories}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Command className="size-4 text-primary" />
            快捷动作
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {panelActions[page].map((action) => (
            <Button key={action} variant="secondary" className="justify-start">
              {action}
            </Button>
          ))}
          <div className="rounded-lg border border-border/80 bg-background/50 p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 text-foreground">
              <FileStack className="size-3.5 text-primary" />
              项目根目录
            </div>
            <div data-mono="true" className="break-all">
              {workspaceSummary.root}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
