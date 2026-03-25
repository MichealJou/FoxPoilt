/**
 * @file src/commands/config/config-set-language-command.ts
 * @author michaeljou
 */

import { ensureGlobalConfig, GlobalConfigParseError } from '@/config/global-config.js'
import { getMessages } from '@/i18n/messages.js'

import type { CliResult } from '@/commands/init/init-types.js'
import type {
  ConfigSetLanguageArgs,
  ConfigSetLanguageContext,
  ConfigSetLanguageDependencies,
} from '@/commands/config/config-types.js'

/**
 * Resolves the default dependency set for the config language command.
 */
function getDependencies(
  overrides: Partial<ConfigSetLanguageDependencies> = {},
): ConfigSetLanguageDependencies {
  return {
    ensureGlobalConfig,
    ...overrides,
  }
}

function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.configSetLanguage.helpDescription,
    '',
    'foxpilot config set-language',
    'fp config set-language',
    '--lang zh-CN|en-US|ja-JP',
  ].join('\n')
}

/**
 * Persists the selected interface language into the global config file.
 */
export async function runConfigSetLanguageCommand(
  args: ConfigSetLanguageArgs,
  context: ConfigSetLanguageContext,
): Promise<CliResult> {
  const currentMessages = getMessages(context.interfaceLanguage)

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.lang) {
    return {
      exitCode: 1,
      stdout: currentMessages.configSetLanguage.invalidLanguage,
    }
  }

  const dependencies = getDependencies(context.dependencies)

  try {
    const result = await dependencies.ensureGlobalConfig({
      homeDir: context.homeDir,
      interfaceLanguage: args.lang,
    })
    const nextMessages = getMessages(result.config.interfaceLanguage)

    return {
      exitCode: 0,
      stdout: [
        nextMessages.configSetLanguage.updated,
        `- interfaceLanguage: ${result.config.interfaceLanguage}`,
        `- configPath: ${result.configPath}`,
      ].join('\n'),
    }
  } catch (error) {
    if (error instanceof GlobalConfigParseError) {
      return {
        exitCode: 3,
        stdout: [
          currentMessages.configSetLanguage.malformedGlobalConfig,
          `- ${error.configPath}`,
        ].join('\n'),
      }
    }

    throw error
  }
}
