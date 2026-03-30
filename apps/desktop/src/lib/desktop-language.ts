export const desktopInterfaceLanguages = ['zh-CN', 'en-US', 'ja-JP'] as const

export type DesktopInterfaceLanguage = (typeof desktopInterfaceLanguages)[number]

export type DesktopLanguagePreference = DesktopInterfaceLanguage | 'system'

export function isDesktopInterfaceLanguage(value: string): value is DesktopInterfaceLanguage {
  return desktopInterfaceLanguages.includes(value as DesktopInterfaceLanguage)
}

export function isDesktopLanguagePreference(value: string): value is DesktopLanguagePreference {
  return value === 'system' || isDesktopInterfaceLanguage(value)
}

export function resolveSystemLanguage(
  candidates: readonly string[] | string | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator.languages.length > 0
      ? navigator.languages
      : navigator.language,
): DesktopInterfaceLanguage {
  const inputs = Array.isArray(candidates) ? candidates : candidates ? [candidates] : []

  for (const candidate of inputs) {
    const normalized = candidate.toLowerCase()
    if (normalized.startsWith('zh')) {
      return 'zh-CN'
    }

    if (normalized.startsWith('ja')) {
      return 'ja-JP'
    }

    if (normalized.startsWith('en')) {
      return 'en-US'
    }
  }

  return 'zh-CN'
}
