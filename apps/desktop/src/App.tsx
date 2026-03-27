import { useEffect, useState } from 'react'

import { AppLayout } from '@desktop/components/app-layout.js'
import { isDesktopPageId, type DesktopPageId } from '@desktop/lib/desktop-pages.js'
import { readDesktopRuntimeStatus } from '@desktop/lib/tauri-bridge.js'
import type { DesktopRuntimeStatus } from '@desktop/lib/tauri-status.js'

function readCurrentPage(): DesktopPageId {
  if (typeof window === 'undefined') {
    return 'dashboard'
  }

  const candidate = window.location.hash.replace(/^#/, '')

  if (candidate && isDesktopPageId(candidate)) {
    return candidate
  }

  return 'dashboard'
}

export function App() {
  const [currentPage, setCurrentPage] = useState<DesktopPageId>(() => readCurrentPage())
  const [runtimeStatus, setRuntimeStatus] = useState<DesktopRuntimeStatus>()

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(readCurrentPage())
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    let active = true

    void readDesktopRuntimeStatus().then((status) => {
      if (active) {
        setRuntimeStatus(status)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const handleNavigate = (page: DesktopPageId) => {
    if (typeof window !== 'undefined') {
      window.location.hash = page
    }

    setCurrentPage(page)
  }

  return <AppLayout currentPage={currentPage} onNavigate={handleNavigate} runtimeStatus={runtimeStatus} />
}

export default App
