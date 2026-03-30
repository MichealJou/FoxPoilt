/**
 * @file interface-language.ts
 * @author michaeljou
 */

/**
 * CLI 与桌面共享的交互语言列表。
 */
export const interfaceLanguages = ['zh-CN', 'en-US', 'ja-JP'] as const

/**
 * 基于语言列表生成的字面量联合类型。
 */
export type InterfaceLanguage = (typeof interfaceLanguages)[number]

/**
 * 读取 JSON 中持久化语言值时使用的运行时类型守卫。
 */
export function isInterfaceLanguage(value: string): value is InterfaceLanguage {
  return interfaceLanguages.includes(value as InterfaceLanguage)
}
