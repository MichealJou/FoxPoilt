import { useEffect, useMemo, useState } from 'react'
import { App as AntdApp, ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd'
import * as enUS from 'antd/locale/en_US.js'
import * as jaJP from 'antd/locale/ja_JP.js'
import * as zhCN from 'antd/locale/zh_CN.js'

import { AppLayout } from '@desktop/components/app-layout.js'
import { isDesktopPageId, type DesktopPageId } from '@desktop/lib/desktop-pages.js'
import {
  applyResolvedDesktopTheme,
  detectSystemDarkMode,
  readStoredDesktopLanguagePreference,
  readStoredDesktopThemePreference,
  resolveDesktopLanguage,
  resolveDesktopTheme,
  storeDesktopLanguagePreference,
  storeDesktopThemePreference,
  type DesktopThemePreference,
} from '@desktop/lib/desktop-preferences.js'
import { getDesktopViewModel } from '@desktop/lib/mock-data.js'
import { readDesktopRuntimeStatus } from '@desktop/lib/tauri-bridge.js'
import type { DesktopRuntimeStatus } from '@desktop/lib/tauri-status.js'
import type {
  DesktopInterfaceLanguage,
  DesktopLanguagePreference,
} from '@desktop/lib/desktop-language.js'

const desktopLocales = {
  'zh-CN': zhCN.default,
  'en-US': enUS.default,
  'ja-JP': jaJP.default,
} as const

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
  const [languagePreference, setLanguagePreference] = useState<DesktopLanguagePreference>(() =>
    readStoredDesktopLanguagePreference(),
  )
  const [themePreference, setThemePreference] = useState<DesktopThemePreference>(() =>
    readStoredDesktopThemePreference(),
  )
  const [prefersDark, setPrefersDark] = useState<boolean>(() => detectSystemDarkMode())

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

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    setPrefersDark(mediaQuery.matches)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const resolvedLanguage = useMemo<DesktopInterfaceLanguage>(
    () => resolveDesktopLanguage(languagePreference),
    [languagePreference],
  )
  const resolvedTheme = useMemo(
    () => resolveDesktopTheme(themePreference, prefersDark),
    [prefersDark, themePreference],
  )
  const viewModel = useMemo(() => getDesktopViewModel(resolvedLanguage), [resolvedLanguage])
  const antdThemeConfig = useMemo<ThemeConfig>(() => {
    const isDark = resolvedTheme === 'dark'

    return {
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: isDark ? '#8fb8ff' : '#1f5ed8',
        borderRadius: 14,
        fontFamily: "'IBM Plex Sans', 'SF Pro Display', ui-sans-serif, system-ui, sans-serif",
        colorBgBase: isDark ? '#131416' : '#f4f5f7',
        colorBgContainer: isDark ? '#1a1c20' : '#ffffff',
        colorBorder: isDark ? '#32363d' : '#d7dbe2',
        colorTextBase: isDark ? '#f2f4f8' : '#181c22',
      },
      components: {
        Layout: {
          siderBg: isDark ? '#232529' : '#ededf0',
          bodyBg: isDark ? '#131416' : '#f4f5f7',
          headerBg: 'transparent',
        },
        Menu: {
          darkItemBg: '#232529',
          darkSubMenuItemBg: '#232529',
          darkItemSelectedBg: '#343840',
          darkItemHoverBg: '#2b2f36',
          itemBg: isDark ? '#232529' : '#ededf0',
          itemSelectedBg: isDark ? '#343840' : '#dde4ef',
          itemHoverBg: isDark ? '#2b2f36' : '#e4e8ee',
          itemBorderRadius: 12,
        },
        Button: {
          borderRadius: 12,
          controlHeight: 40,
        },
        Card: {
          borderRadiusLG: 18,
        },
      },
    }
  }, [resolvedTheme])

  useEffect(() => {
    applyResolvedDesktopTheme(resolvedTheme)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = resolvedLanguage
    }
  }, [resolvedLanguage, resolvedTheme])

  const handleNavigate = (page: DesktopPageId) => {
    if (typeof window !== 'undefined') {
      window.location.hash = page
    }

    setCurrentPage(page)
  }

  const handleLanguageChange = (nextPreference: DesktopLanguagePreference) => {
    setLanguagePreference(nextPreference)
    storeDesktopLanguagePreference(nextPreference)
  }

  const handleThemeChange = (nextPreference: DesktopThemePreference) => {
    setThemePreference(nextPreference)
    storeDesktopThemePreference(nextPreference)
  }

  return (
    <ConfigProvider locale={desktopLocales[resolvedLanguage] as never} theme={antdThemeConfig}>
      <AntdApp>
        <AppLayout
          currentPage={currentPage}
          languagePreference={languagePreference}
          onLanguageChange={handleLanguageChange}
          onNavigate={handleNavigate}
          onThemeChange={handleThemeChange}
          resolvedLanguage={resolvedLanguage}
          resolvedTheme={resolvedTheme}
          runtimeStatus={runtimeStatus}
          themePreference={themePreference}
          viewModel={viewModel}
        />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
