import { ContextPanel } from '@desktop/components/context-panel.js'
import { Navigation } from '@desktop/components/navigation.js'
import { PageContent } from '@desktop/components/page-content.js'
import { Badge } from '@desktop/components/ui/badge.js'
import { Button } from '@desktop/components/ui/button.js'
import { desktopPageMeta } from '@desktop/lib/mock-data.js'
import type { DesktopPageId } from '@desktop/lib/desktop-pages.js'
import type { DesktopRuntimeStatus } from '@desktop/lib/tauri-status.js'

export function AppLayout({
  currentPage = 'dashboard',
  onNavigate = () => {},
  runtimeStatus,
}: {
  currentPage?: DesktopPageId
  onNavigate?: (page: DesktopPageId) => void
  runtimeStatus?: DesktopRuntimeStatus
}) {
  const pageMeta = desktopPageMeta[currentPage]
  const shellLabel = runtimeStatus?.shell === 'tauri' ? 'Tauri 已连接' : 'Web 预览模式'

  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr_340px] bg-background text-foreground">
      <aside className="border-r border-border bg-card/65 px-4 py-5">
        <div className="mb-6 rounded-2xl border border-border/80 bg-background/40 px-4 py-4">
          <div className="text-xs uppercase tracking-[0.22em] text-primary">FoxPilot</div>
          <div className="mt-2 text-xl font-semibold">Desktop Console</div>
          <div className="mt-1 text-sm text-muted-foreground">Tauri + Runtime Core 控制台</div>
        </div>
        <Navigation currentPage={currentPage} onNavigate={onNavigate} />
      </aside>
      <main className="px-6 py-5">
        <header className="mb-6 flex items-center justify-between gap-6 rounded-2xl border border-border/80 bg-card/70 px-5 py-4 shadow-[0_24px_60px_rgba(3,10,24,0.28)] backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-primary">{pageMeta.eyebrow}</div>
            <h1 className="mt-2 text-2xl font-semibold">{pageMeta.label}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{pageMeta.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={runtimeStatus?.shell === 'tauri' ? 'success' : 'outline'}>{shellLabel}</Badge>
            <Button variant="outline">
              {runtimeStatus ? `平台 ${runtimeStatus.platformAdapters.length}` : '打开 CLI 预览'}
            </Button>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          <PageContent page={currentPage} />
        </div>
      </main>
      <section className="border-l border-border bg-card/55 px-4 py-5">
        <ContextPanel page={currentPage} />
      </section>
    </div>
  )
}
