/**
 * @file src/commands/config/config-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { ensureGlobalConfig } from '@/config/global-config.js'
import type { InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * Normalized arguments for `config set-language`.
 */
export type ConfigSetLanguageArgs = {
  command: 'config'
  subcommand: 'set-language'
  help: boolean
  lang?: InterfaceLanguage
}

/**
 * Injectable collaborators used by language configuration commands.
 */
export type ConfigSetLanguageDependencies = {
  ensureGlobalConfig: typeof ensureGlobalConfig
}

/**
 * Runtime context used while executing config commands.
 */
export type ConfigSetLanguageContext = CliRuntimeContext & {
  dependencies?: Partial<ConfigSetLanguageDependencies>
}
