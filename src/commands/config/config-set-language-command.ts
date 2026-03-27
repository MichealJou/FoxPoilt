/**
 * @file src/commands/config/config-set-language-command.ts
 * @author michaeljou
 */

import { ensureGlobalConfig, GlobalConfigParseError } from '@foxpilot/infra/config/global-config.js'
import { getMessages } from '@/i18n/messages.js'

import type { CliResult } from '@/commands/init/init-types.js'
import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type {
  ConfigSetLanguageArgs,
  ConfigSetLanguageContext,
  ConfigSetLanguageDependencies,
} from '@/commands/config/config-types.js'

/**
 * 解析语言配置命令使用的默认依赖集合。
 *
 * 语言设置命令只依赖全局配置写入能力，不关心数据库、项目配置或仓库状态。
 * 这种最小依赖设计可以保证：
 * - 在任意目录下都能执行；
 * - 出问题时排查面很小；
 * - 测试时只需要替换一个依赖即可覆盖主要分支。
 */
function getDependencies(
  overrides: Partial<ConfigSetLanguageDependencies> = {},
): ConfigSetLanguageDependencies {
  return {
    ensureGlobalConfig,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 *
 * 允许值直接列出，是为了让用户明确这是“受控枚举”而不是任意语言标签。
 * 这样后续文案字典、README 和配置持久化都能围绕同一套 locale 常量展开。
 */
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
 * 将选中的交互语言持久化到全局配置文件。
 *
 * 这里使用“写入后再切换消息字典”的策略，而不是直接沿用当前语言回显成功信息，
 * 因为用户执行这条命令最直接的预期，就是下一行输出立刻变成目标语言。
 */
export async function runConfigSetLanguageCommand(
  args: ConfigSetLanguageArgs,
  context: ConfigSetLanguageContext,
): Promise<CliResult> {
  const commandName = 'config.set-language'
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
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'INVALID_LANGUAGE',
            message: currentMessages.configSetLanguage.invalidLanguage,
          })
        : currentMessages.configSetLanguage.invalidLanguage,
    }
  }

  const dependencies = getDependencies(context.dependencies)

  try {
    const result = await dependencies.ensureGlobalConfig({
      homeDir: context.homeDir,
      interfaceLanguage: args.lang,
    })
    const nextMessages = getMessages(result.config.interfaceLanguage)
    const data = {
      interfaceLanguage: result.config.interfaceLanguage,
      configPath: result.configPath,
    }

    return {
      exitCode: 0,
      stdout: args.json
        ? toJsonSuccessOutput(commandName, data)
        : [
            nextMessages.configSetLanguage.updated,
            `- interfaceLanguage: ${result.config.interfaceLanguage}`,
            `- configPath: ${result.configPath}`,
          ].join('\n'),
    }
  } catch (error) {
    if (error instanceof GlobalConfigParseError) {
      return {
        exitCode: 3,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'MALFORMED_GLOBAL_CONFIG',
              message: currentMessages.configSetLanguage.malformedGlobalConfig,
              details: {
                configPath: error.configPath,
              },
            })
          : [
              currentMessages.configSetLanguage.malformedGlobalConfig,
              `- ${error.configPath}`,
            ].join('\n'),
      }
    }

    throw error
  }
}
