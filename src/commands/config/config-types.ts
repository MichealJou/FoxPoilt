/**
 * @file src/commands/config/config-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { ensureGlobalConfig } from '@/config/global-config.js'
import type { InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * `config set-language` 的标准化参数。
 */
export type ConfigSetLanguageArgs = {
  command: 'config'
  subcommand: 'set-language'
  help: boolean
  lang?: InterfaceLanguage
}

/**
 * 语言配置命令使用的可注入依赖。
 */
export type ConfigSetLanguageDependencies = {
  ensureGlobalConfig: typeof ensureGlobalConfig
}

/**
 * 执行配置命令时使用的运行时上下文。
 */
export type ConfigSetLanguageContext = CliRuntimeContext & {
  dependencies?: Partial<ConfigSetLanguageDependencies>
}
