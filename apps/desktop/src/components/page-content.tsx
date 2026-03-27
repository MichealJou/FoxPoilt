import { AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react'

import {
  dashboardStats,
  eventGroups,
  focusQueue,
  healthIssues,
  mcpRegistry,
  platformRegistry,
  runTimeline,
  skillRegistry,
  tasksTable,
  workspaceSummary,
} from '@desktop/lib/mock-data.js'
import type { DesktopPageId } from '@desktop/lib/desktop-pages.js'
import { Badge } from '@desktop/components/ui/badge.js'
import { Button } from '@desktop/components/ui/button.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@desktop/components/ui/card.js'
import { Separator } from '@desktop/components/ui/separator.js'

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'outline' {
  if (status === 'ready' || status === 'success') {
    return 'success'
  }

  if (status === 'degraded' || status === 'queued' || status === 'warning') {
    return 'warning'
  }

  if (status === 'unavailable' || status === 'danger') {
    return 'danger'
  }

  return 'default'
}

export function PageContent({ page }: { page: DesktopPageId }) {
  switch (page) {
    case 'dashboard':
      return (
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-3xl">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{stat.delta}</CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Focus Queue</CardTitle>
                <CardDescription>基于优先级、阻塞性和阶段交接计算出的当前焦点列表。</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {focusQueue.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-lg border border-border/80 bg-background/50 px-4 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.stage} · {item.platform}
                      </span>
                    </div>
                    <Badge variant={item.priority === 'P0' ? 'danger' : 'warning'}>{item.priority}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>异常入口</CardTitle>
                <CardDescription>高风险和待确认事项优先暴露到首屏。</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {healthIssues.map((issue) => (
                  <div key={issue.title} className="rounded-lg border border-border/80 bg-background/40 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-warning" />
                      <span className="font-medium">{issue.title}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{issue.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      )

    case 'workspace':
      return (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>当前项目</CardTitle>
              <CardDescription>项目级接管结果和 profile 生效状态。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Root</div>
                <div className="mt-1 break-all font-medium" data-mono="true">{workspaceSummary.root}</div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Profile</div>
                  <div className="mt-1 font-medium">{workspaceSummary.profile}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Executor</div>
                  <div className="mt-1 font-medium">{workspaceSummary.executorStrategy}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Repositories</div>
                  <div className="mt-1 font-medium">{workspaceSummary.repositories}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>扫描信号</CardTitle>
              <CardDescription>初始化推荐引擎和执行器解析依赖的项目信号。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                'package.json',
                'pnpm-lock.yaml',
                'turbo.json',
                'vitest.config.ts',
                'docs/specs',
                'src-tauri',
              ].map((signal) => (
                <div key={signal} className="rounded-lg border border-border/80 bg-background/50 px-4 py-3 text-sm">
                  {signal}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )

    case 'tasks':
      return (
        <Card>
          <CardHeader>
            <CardTitle>任务中心</CardTitle>
            <CardDescription>当前任务以表格优先呈现，方便桌面端高密度筛选。</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-lg border border-border/80 bg-background/40">
            <div className="grid grid-cols-[2fr_0.8fr_1fr_1fr_0.8fr] border-b border-border/80 px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <span>名称</span>
              <span>来源</span>
              <span>状态</span>
              <span>平台</span>
              <span>优先级</span>
            </div>
            {tasksTable.map((task) => (
              <div
                key={task.title}
                className="grid grid-cols-[2fr_0.8fr_1fr_1fr_0.8fr] items-center px-4 py-3 text-sm even:bg-background/30"
              >
                <span className="font-medium">{task.title}</span>
                <span className="text-muted-foreground">{task.source}</span>
                <Badge variant={task.status === 'todo' ? 'outline' : 'default'}>{task.status}</Badge>
                <span className="text-muted-foreground">{task.owner}</span>
                <Badge variant={task.priority === 'P0' ? 'danger' : 'warning'}>{task.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )

    case 'runs':
      return (
        <Card>
          <CardHeader>
            <CardTitle>运行详情概览</CardTitle>
            <CardDescription>按阶段和角色串起多平台交接过程。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {runTimeline.map((item, index) => (
              <div key={item.stage} className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-full border border-border bg-background/70">
                  {item.status === 'success' ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <Sparkles className="size-4 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.stage}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.role} · {item.platform}
                  </div>
                </div>
                <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                {index < runTimeline.length - 1 ? <ArrowRight className="size-4 text-muted-foreground" /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )

    case 'events':
      return (
        <div className="grid gap-4 lg:grid-cols-3">
          {eventGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardDescription>{group.title}</CardDescription>
                <CardTitle className="text-3xl">{group.count}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{group.detail}</CardContent>
            </Card>
          ))}
        </div>
      )

    case 'control-plane':
      return (
        <div className="grid gap-4 xl:grid-cols-3">
          <RegistryCard
            title="Platforms"
            description="多 agent 平台按角色能力统一纳入中控。"
            items={platformRegistry}
          />
          <RegistryCard
            title="Skills"
            description="平台可绑定的技能集合，供阶段模板和动作协议引用。"
            items={skillRegistry}
          />
          <RegistryCard
            title="MCP"
            description="统一观察和修复各类 MCP 入口状态。"
            items={mcpRegistry}
          />
        </div>
      )

    case 'health':
      return (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Doctor / Repair</CardTitle>
              <CardDescription>Foundation、绑定和平台探测都统一纳入健康决策矩阵。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {healthIssues.map((issue) => (
                <div key={issue.title} className="rounded-lg border border-border/80 bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium">{issue.title}</span>
                    <Badge variant={statusVariant(issue.severity)}>{issue.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{issue.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>建议动作</CardTitle>
              <CardDescription>把修复入口压到操作面板，减少 CLI 记忆负担。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {['运行 foundation doctor', '刷新 Skills 注册表', '重新探测 Trae 平台'].map((action) => (
                <Button key={action} variant="outline" className="justify-between">
                  {action}
                  <ChevronRight className="size-4" />
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )
  }
}

function RegistryCard({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: ReadonlyArray<{ name: string; role?: string; scope?: string; endpoint?: string; status: string }>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.name} className="rounded-lg border border-border/80 bg-background/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{item.name}</div>
              <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {item.role ?? item.scope ?? item.endpoint}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
