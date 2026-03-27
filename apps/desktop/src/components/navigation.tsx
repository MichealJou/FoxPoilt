import {
  Activity,
  Blocks,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Orbit,
  Workflow,
} from 'lucide-react'

import { Button } from '@desktop/components/ui/button.js'
import { desktopPageMeta } from '@desktop/lib/mock-data.js'
import type { DesktopPageId } from '@desktop/lib/desktop-pages.js'
import { cn } from '@desktop/lib/utils.js'

const NAV_ITEMS: Array<{
  id: DesktopPageId
  icon: typeof LayoutDashboard
}> = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'workspace', icon: FolderKanban },
  { id: 'tasks', icon: ListTodo },
  { id: 'runs', icon: Workflow },
  { id: 'events', icon: Activity },
  { id: 'control-plane', icon: Blocks },
  { id: 'health', icon: Orbit },
]

export function Navigation({
  currentPage,
  onNavigate,
}: {
  currentPage: DesktopPageId
  onNavigate: (page: DesktopPageId) => void
}) {
  return (
    <nav aria-label="FoxPilot 主导航" className="flex flex-col gap-2">
      {NAV_ITEMS.map(({ id, icon: Icon }) => {
        const active = currentPage === id

        return (
          <Button
            key={id}
            variant="ghost"
            className={cn(
              'h-auto justify-start rounded-xl px-3 py-3 text-left',
              active
                ? 'bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_rgba(56,189,248,0.18)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onNavigate(id)}
          >
            <Icon className="size-4" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{desktopPageMeta[id].label}</span>
              <span className="text-xs text-muted-foreground">{desktopPageMeta[id].eyebrow}</span>
            </span>
          </Button>
        )
      })}
    </nav>
  )
}
