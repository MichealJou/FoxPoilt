import { describe, expect, it } from 'vitest'

import {
  isDesktopThemePreference,
  resolveDesktopLanguage,
  resolveDesktopTheme,
} from '@desktop/lib/desktop-preferences.js'

describe('desktop preferences', () => {
  it('resolves system language into supported interface locales', () => {
    expect(resolveDesktopLanguage('system', ['ja-JP'])).toBe('ja-JP')
    expect(resolveDesktopLanguage('system', ['en-GB'])).toBe('en-US')
    expect(resolveDesktopLanguage('system', ['zh-TW'])).toBe('zh-CN')
  })

  it('resolves theme preference against system dark mode', () => {
    expect(resolveDesktopTheme('system', true)).toBe('dark')
    expect(resolveDesktopTheme('system', false)).toBe('light')
    expect(resolveDesktopTheme('dark', false)).toBe('dark')
    expect(resolveDesktopTheme('light', true)).toBe('light')
  })

  it('guards desktop theme preference values', () => {
    expect(isDesktopThemePreference('system')).toBe(true)
    expect(isDesktopThemePreference('dark')).toBe(true)
    expect(isDesktopThemePreference('light')).toBe(true)
    expect(isDesktopThemePreference('blue')).toBe(false)
  })
})
