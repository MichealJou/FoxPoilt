import {
  isDesktopLanguagePreference,
  resolveSystemLanguage,
  type DesktopInterfaceLanguage,
  type DesktopLanguagePreference,
} from '@desktop/lib/desktop-language.js'

export const desktopPreferenceStorageKeys = {
  language: 'foxpilot.desktop.language',
  theme: 'foxpilot.desktop.theme',
} as const

export type DesktopThemePreference = 'system' | 'dark' | 'light'
export type ResolvedDesktopTheme = 'dark' | 'light'

export function isDesktopThemePreference(value: string): value is DesktopThemePreference {
  return value === 'system' || value === 'dark' || value === 'light'
}

export function readStoredDesktopLanguagePreference(): DesktopLanguagePreference {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const value = window.localStorage.getItem(desktopPreferenceStorageKeys.language)
  return value && isDesktopLanguagePreference(value) ? value : 'system'
}

export function readStoredDesktopThemePreference(): DesktopThemePreference {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const value = window.localStorage.getItem(desktopPreferenceStorageKeys.theme)
  return value && isDesktopThemePreference(value) ? value : 'dark'
}

export function resolveDesktopLanguage(
  preference: DesktopLanguagePreference,
  candidates?: readonly string[] | string,
): DesktopInterfaceLanguage {
  if (preference === 'system') {
    return resolveSystemLanguage(candidates)
  }

  return preference
}

export function resolveDesktopTheme(
  preference: DesktopThemePreference,
  prefersDark: boolean,
): ResolvedDesktopTheme {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light'
  }

  return preference
}

export function storeDesktopLanguagePreference(preference: DesktopLanguagePreference) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(desktopPreferenceStorageKeys.language, preference)
}

export function storeDesktopThemePreference(preference: DesktopThemePreference) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(desktopPreferenceStorageKeys.theme, preference)
}

export function detectSystemDarkMode(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyResolvedDesktopTheme(theme: ResolvedDesktopTheme) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}
