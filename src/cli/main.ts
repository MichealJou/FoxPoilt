/**
 * @file src/cli/main.ts
 * @author michaeljou
 */

import os from 'node:os'

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import { parseArgs } from '@/cli/parse-args.js'
import { runConfigSetLanguageCommand } from '@/commands/config/config-set-language-command.js'
import { runInitCommand } from '@/commands/init/init-command.js'
import type { CliResult, InitCommandContext } from '@/commands/init/init-types.js'
import { runTaskCreateCommand } from '@/commands/task/task-create-command.js'
import { runTaskListCommand } from '@/commands/task/task-list-command.js'
import { runTaskShowCommand } from '@/commands/task/task-show-command.js'
import { runTaskUpdateStatusCommand } from '@/commands/task/task-update-status-command.js'
import { resolveInterfaceLanguage } from '@/config/global-config.js'
import { getMessages } from '@/i18n/messages.js'

/**
 * CLI 入口函数，负责解析当前生效语言并分发到具体命令处理器。
 */
export async function main(
  argv: string[],
  context: Partial<CliRuntimeContext> = {},
): Promise<CliResult> {
  const args = parseArgs(argv)
  const homeDir = context.homeDir ?? os.homedir()
  const interfaceLanguage = context.interfaceLanguage ?? await resolveInterfaceLanguage({ homeDir })
  const messages = getMessages(interfaceLanguage)

  if (args.command === 'init') {
    return runInitCommand(
      {
        command: 'init',
        help: args.help,
        path: args.path,
        name: args.name,
        workspaceRoot: args.workspaceRoot,
        mode: args.mode,
        noScan: args.noScan,
      },
      {
        binName: context.binName ?? 'foxpilot',
        cwd: context.cwd ?? process.cwd(),
        homeDir,
        stdin: [...(context.stdin ?? [])],
        interfaceLanguage,
        dependencies: context.dependencies as InitCommandContext['dependencies'],
      },
    )
  }

  if (args.command === 'task' && args.subcommand === 'create') {
    return runTaskCreateCommand(
      {
        command: 'task',
        subcommand: 'create',
        help: args.help,
        path: args.path,
        title: args.title,
        description: args.description,
        priority: args.priority,
        taskType: args.taskType,
        repository: args.repository,
      },
      {
        binName: context.binName ?? 'foxpilot',
        cwd: context.cwd ?? process.cwd(),
        homeDir,
        stdin: [...(context.stdin ?? [])],
        interfaceLanguage,
        dependencies: context.dependencies,
      },
    )
  }

  if (args.command === 'task' && args.subcommand === 'list') {
    return runTaskListCommand(
      {
        command: 'task',
        subcommand: 'list',
        help: args.help,
        path: args.path,
        status: args.status,
      },
      {
        binName: context.binName ?? 'foxpilot',
        cwd: context.cwd ?? process.cwd(),
        homeDir,
        stdin: [...(context.stdin ?? [])],
        interfaceLanguage,
        dependencies: context.dependencies,
      },
    )
  }

  if (args.command === 'task' && args.subcommand === 'update-status') {
    return runTaskUpdateStatusCommand(
      {
        command: 'task',
        subcommand: 'update-status',
        help: args.help,
        path: args.path,
        id: args.id,
        status: args.status,
      },
      {
        binName: context.binName ?? 'foxpilot',
        cwd: context.cwd ?? process.cwd(),
        homeDir,
        stdin: [...(context.stdin ?? [])],
        interfaceLanguage,
        dependencies: context.dependencies,
      },
    )
  }

  if (args.command === 'task' && args.subcommand === 'show') {
    return runTaskShowCommand(
      {
        command: 'task',
        subcommand: 'show',
        help: args.help,
        path: args.path,
        id: args.id,
      },
      {
        binName: context.binName ?? 'foxpilot',
        cwd: context.cwd ?? process.cwd(),
        homeDir,
        stdin: [...(context.stdin ?? [])],
        interfaceLanguage,
        dependencies: context.dependencies,
      },
    )
  }

  if (args.command === 'config' && args.subcommand === 'set-language') {
    return runConfigSetLanguageCommand(
      {
        command: 'config',
        subcommand: 'set-language',
        help: args.help,
        lang: args.lang,
      },
      {
        binName: context.binName ?? 'foxpilot',
        cwd: context.cwd ?? process.cwd(),
        homeDir,
        stdin: [...(context.stdin ?? [])],
        interfaceLanguage,
        dependencies: context.dependencies,
      },
    )
  }

  return {
    exitCode: 1,
    stdout: messages.common.unknownCommand,
  }
}
