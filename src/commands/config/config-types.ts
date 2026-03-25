/**
 * @file src/commands/config/config-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { ensureGlobalConfig } from '@/config/global-config.js'
import type { InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * `config set-language` 的标准化参数。
 *
 * 这是纯全局配置命令，不依赖项目上下文，因此参数集合只有帮助开关和目标语言。
 */
export type ConfigSetLanguageArgs = {
  /** 顶层命令标识。 */
  command: 'config'
  /** 二级命令标识，固定为 `set-language`。 */
  subcommand: 'set-language'
  /** 为 true 时只输出帮助文本。 */
  help: boolean
  /** 目标交互语言；只允许进入受支持的 locale 枚举。 */
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
 *
 * 虽然这个命令几乎不使用 cwd 和 stdin，但仍沿用统一上下文结构，
 * 这样主分发器在拼装命令上下文时就不需要区分不同命令的特殊结构。
 */
export type ConfigSetLanguageContext = CliRuntimeContext<ConfigSetLanguageDependencies>
