import os from 'node:os'

import type { CliRuntimeContext } from './runtime-context.js'
import { runTaskCreateCommand } from '../commands/task/task-create-command.js'
import { runTaskListCommand } from '../commands/task/task-list-command.js'
import { runTaskShowCommand } from '../commands/task/task-show-command.js'
import { runTaskUpdateStatusCommand } from '../commands/task/task-update-status-command.js'
import { runInitCommand } from '../commands/init/init-command.js'
import type { CliResult, InitCommandContext } from '../commands/init/init-types.js'
import { parseArgs } from './parse-args.js'

export async function main(
  argv: string[],
  context: Partial<CliRuntimeContext> = {},
): Promise<CliResult> {
  const args = parseArgs(argv)

  if (args.command === 'init' && args.help) {
    return {
      exitCode: 0,
      stdout: 'foxpilot init\nfp init',
    }
  }

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
        homeDir: context.homeDir ?? os.homedir(),
        stdin: [...(context.stdin ?? [])],
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
        homeDir: context.homeDir ?? os.homedir(),
        stdin: [...(context.stdin ?? [])],
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
        homeDir: context.homeDir ?? os.homedir(),
        stdin: [...(context.stdin ?? [])],
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
        homeDir: context.homeDir ?? os.homedir(),
        stdin: [...(context.stdin ?? [])],
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
        homeDir: context.homeDir ?? os.homedir(),
        stdin: [...(context.stdin ?? [])],
        dependencies: context.dependencies,
      },
    )
  }

  return {
    exitCode: 1,
    stdout: 'unknown command',
  }
}
