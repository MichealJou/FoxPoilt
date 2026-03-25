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
import { runTaskHistoryCommand } from '@/commands/task/task-history-command.js'
import { runTaskListCommand } from '@/commands/task/task-list-command.js'
import { runTaskNextCommand } from '@/commands/task/task-next-command.js'
import { runTaskShowCommand } from '@/commands/task/task-show-command.js'
import { runTaskSuggestScanCommand } from '@/commands/task/task-suggest-scan-command.js'
import { runTaskUpdateExecutorCommand } from '@/commands/task/task-update-executor-command.js'
import { runTaskUpdatePriorityCommand } from '@/commands/task/task-update-priority-command.js'
import { runTaskUpdateStatusCommand } from '@/commands/task/task-update-status-command.js'
import { resolveInterfaceLanguage } from '@/config/global-config.js'
import { getMessages } from '@/i18n/messages.js'

/**
 * CLI 入口函数，负责解析当前生效语言并分发到具体命令处理器。
 *
 * 入口层只做三件事：
 * 1. 解析 argv；
 * 2. 解析运行时环境和当前语言；
 * 3. 把标准化参数转交给对应命令。
 *
 * 它不直接写文件、不直接操作数据库，也不拼接业务 SQL。
 * 这样主入口可以长期保持稳定，新增命令时只需要添加路由分支。
 */
export async function main(
  argv: string[],
  context: Partial<CliRuntimeContext> = {},
): Promise<CliResult> {
  const args = parseArgs(argv)
  const homeDir = context.homeDir ?? os.homedir()
  /**
   * 语言解析放在命令分发前统一完成，保证：
   * - 未命中具体命令时，unknown command 也能本地化；
   * - 所有命令默认共享同一份当前语言；
   * - 测试可以通过 context 直接覆盖，无需真的写全局配置文件。
   */
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
        priority: args.priority ?? 'P2',
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
        source: args.source,
        executor: args.executor,
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

  if (args.command === 'task' && args.subcommand === 'next') {
    return runTaskNextCommand(
      {
        command: 'task',
        subcommand: 'next',
        help: args.help,
        path: args.path,
        source: args.source,
        executor: args.executor,
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

  if (args.command === 'task' && args.subcommand === 'update-executor') {
    return runTaskUpdateExecutorCommand(
      {
        command: 'task',
        subcommand: 'update-executor',
        help: args.help,
        path: args.path,
        id: args.id,
        executor: args.executor,
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

  if (args.command === 'task' && args.subcommand === 'update-priority') {
    return runTaskUpdatePriorityCommand(
      {
        command: 'task',
        subcommand: 'update-priority',
        help: args.help,
        path: args.path,
        id: args.id,
        priority: args.priority,
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

  if (args.command === 'task' && args.subcommand === 'history') {
    return runTaskHistoryCommand(
      {
        command: 'task',
        subcommand: 'history',
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

  if (args.command === 'task' && args.subcommand === 'suggest-scan') {
    return runTaskSuggestScanCommand(
      {
        command: 'task',
        subcommand: 'suggest-scan',
        help: args.help,
        path: args.path,
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
