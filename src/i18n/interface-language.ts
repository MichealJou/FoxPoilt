/**
 * @file src/i18n/interface-language.ts
 * @author michaeljou
 */

/**
 * Supported interface languages exposed by the CLI.
 */
export const interfaceLanguages = ['zh-CN', 'en-US', 'ja-JP'] as const

/**
 * Literal union generated from the supported language list.
 */
export type InterfaceLanguage = (typeof interfaceLanguages)[number]

/**
 * Runtime guard used when reading persisted language values from JSON.
 */
export function isInterfaceLanguage(value: string): value is InterfaceLanguage {
  return interfaceLanguages.includes(value as InterfaceLanguage)
}
