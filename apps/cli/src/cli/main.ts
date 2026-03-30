/**
 * @file src/cli/main.ts
 * @author michaeljou
 */

import os from 'node:os'

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import { parseArgs } from '@/cli/parse-args.js'
import { runConfigSetLanguageCommand } from '@/commands/config/config-set-language-command.js'
import { runControlPlaneOverviewCommand } from '@/commands/control-plane/control-plane-overview-command.js'
import { runInitCommand } from '@/commands/init/init-command.js'
import type { CliResult, InitCommandContext } from '@/commands/init/init-types.js'
import { runMcpInspectCommand } from '@/commands/mcp/mcp-inspect-command.js'
import { runMcpListCommand } from '@/commands/mcp/mcp-list-command.js'
import { runMcpDoctorCommand } from '@/commands/mcp/mcp-doctor-command.js'
import { runPlatformsCapabilitiesCommand } from '@/commands/platforms/platforms-capabilities-command.js'
import { runPlatformsDoctorCommand } from '@/commands/platforms/platforms-doctor-command.js'
import { runPlatformsInspectCommand } from '@/commands/platforms/platforms-inspect-command.js'
import { runPlatformsListCommand } from '@/commands/platforms/platforms-list-command.js'
import { runPlatformsResolveCommand } from '@/commands/platforms/platforms-resolve-command.js'
import { runSkillsDoctorCommand } from '@/commands/skills/skills-doctor-command.js'
import { runSkillsInspectCommand } from '@/commands/skills/skills-inspect-command.js'
import { runSkillsListCommand } from '@/commands/skills/skills-list-command.js'
import { runSystemFoundationCommand } from '@/commands/system/system-foundation-command.js'
import { runSystemInstallInfoCommand } from '@/commands/system/system-install-info-command.js'
import { runSystemUninstallCommand } from '@/commands/system/system-uninstall-command.js'
import { runSystemUpdateCommand } from '@/commands/system/system-update-command.js'
import { runSystemVersionCommand } from '@/commands/system/system-version-command.js'
import { runTaskBeadsSummaryCommand } from '@/commands/task/task-beads-summary-command.js'
import { runTaskCreateCommand } from '@/commands/task/task-create-command.js'
import { runTaskDiffBeadsCommand } from '@/commands/task/task-diff-beads-command.js'
import { runTaskDoctorBeadsCommand } from '@/commands/task/task-doctor-beads-command.js'
import { runTaskEditCommand } from '@/commands/task/task-edit-command.js'
import { runTaskExportBeadsCommand } from '@/commands/task/task-export-beads-command.js'
import { runTaskHistoryCommand } from '@/commands/task/task-history-command.js'
import { runTaskImportBeadsCommand } from '@/commands/task/task-import-beads-command.js'
import { runTaskInitBeadsCommand } from '@/commands/task/task-init-beads-command.js'
import { runTaskListCommand } from '@/commands/task/task-list-command.js'
import { runTaskNextCommand } from '@/commands/task/task-next-command.js'
import { runTaskPushBeadsCommand } from '@/commands/task/task-push-beads-command.js'
import { runTaskShowCommand } from '@/commands/task/task-show-command.js'
import { runTaskSuggestScanCommand } from '@/commands/task/task-suggest-scan-command.js'
import { runTaskSyncBeadsCommand } from '@/commands/task/task-sync-beads-command.js'
import { runTaskUpdateExecutorCommand } from '@/commands/task/task-update-executor-command.js'
import { runTaskUpdatePriorityCommand } from '@/commands/task/task-update-priority-command.js'
import { runTaskUpdateStatusCommand } from '@/commands/task/task-update-status-command.js'
import { resolveInterfaceLanguage } from '@foxpilot/infra/config/global-config.js'
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
  const interfaceLanguage =
    context.interfaceLanguage ?? (await resolveInterfaceLanguage({ homeDir }))
  const messages = getMessages(interfaceLanguage)
  /**
   * 运行时公共上下文统一在入口层构造，避免每个路由分支重复拼接同一组字段。
   *
   * 这里新增 `executablePath`，是为了让“当前命令实例识别”成为运行时标准能力，
   * 后续 `install-info`、`update` 和发布相关诊断都可以共用它。
   */
  const runtimeContext = {
    binName: context.binName ?? 'foxpilot',
    executablePath: context.executablePath ?? process.argv[1] ?? 'foxpilot',
    cwd: context.cwd ?? process.cwd(),
    homeDir,
    stdin: [...(context.stdin ?? [])],
    interfaceLanguage,
    dependencies: context.dependencies,
  }

  if (args.command === 'version') {
    return runSystemVersionCommand(
      {
        command: 'version',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'install-info') {
    return runSystemInstallInfoCommand(
      {
        command: 'install-info',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'foundation') {
    return runSystemFoundationCommand(
      {
        command: 'foundation',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'update') {
    return runSystemUpdateCommand(
      {
        command: 'update',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'uninstall') {
    return runSystemUninstallCommand(
      {
        command: 'uninstall',
        help: args.help,
        json: args.json,
        purge: args.purge,
      },
      runtimeContext,
    )
  }

  if (args.command === 'init') {
    return runInitCommand(
      {
        command: 'init',
        help: args.help,
        path: args.path,
        name: args.name,
        workspaceRoot: args.workspaceRoot,
        profile: args.profile,
        mode: args.mode,
        preview: args.preview,
        json: args.json,
        noScan: args.noScan,
      },
      {
        ...runtimeContext,
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
        json: args.json,
        path: args.path,
        title: args.title,
        description: args.description,
        priority: args.priority ?? 'P2',
        taskType: args.taskType ?? 'generic',
        repository: args.repository,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'beads-summary') {
    return runTaskBeadsSummaryCommand(
      {
        command: 'task',
        subcommand: 'beads-summary',
        help: args.help,
        json: args.json,
        path: args.path,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'doctor-beads') {
    return runTaskDoctorBeadsCommand(
      {
        command: 'task',
        subcommand: 'doctor-beads',
        help: args.help,
        json: args.json,
        path: args.path,
        repository: args.repository,
        allRepositories: args.allRepositories,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'init-beads') {
    return runTaskInitBeadsCommand(
      {
        command: 'task',
        subcommand: 'init-beads',
        help: args.help,
        json: args.json,
        path: args.path,
        repository: args.repository,
        allRepositories: args.allRepositories,
        dryRun: args.dryRun,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'edit') {
    return runTaskEditCommand(
      {
        command: 'task',
        subcommand: 'edit',
        help: args.help,
        json: args.json,
        path: args.path,
        id: args.id,
        externalId: args.externalId,
        externalSource: args.externalSource,
        title: args.title,
        description: args.description,
        clearDescription: args.clearDescription,
        taskType: args.taskType,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'list') {
    return runTaskListCommand(
      {
        command: 'task',
        subcommand: 'list',
        help: args.help,
        json: args.json,
        path: args.path,
        status: args.status,
        source: args.source,
        executor: args.executor,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'next') {
    return runTaskNextCommand(
      {
        command: 'task',
        subcommand: 'next',
        help: args.help,
        json: args.json,
        path: args.path,
        source: args.source,
        executor: args.executor,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'update-status') {
    return runTaskUpdateStatusCommand(
      {
        command: 'task',
        subcommand: 'update-status',
        help: args.help,
        json: args.json,
        path: args.path,
        id: args.id,
        externalId: args.externalId,
        externalSource: args.externalSource,
        status: args.status,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'update-executor') {
    return runTaskUpdateExecutorCommand(
      {
        command: 'task',
        subcommand: 'update-executor',
        help: args.help,
        json: args.json,
        path: args.path,
        id: args.id,
        externalId: args.externalId,
        externalSource: args.externalSource,
        executor: args.executor,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'update-priority') {
    return runTaskUpdatePriorityCommand(
      {
        command: 'task',
        subcommand: 'update-priority',
        help: args.help,
        json: args.json,
        path: args.path,
        id: args.id,
        externalId: args.externalId,
        externalSource: args.externalSource,
        priority: args.priority,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'show') {
    return runTaskShowCommand(
      {
        command: 'task',
        subcommand: 'show',
        help: args.help,
        json: args.json,
        path: args.path,
        id: args.id,
        externalId: args.externalId,
        externalSource: args.externalSource,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'push-beads') {
    return runTaskPushBeadsCommand(
      {
        command: 'task',
        subcommand: 'push-beads',
        help: args.help,
        json: args.json,
        path: args.path,
        repository: args.repository,
        allRepositories: args.allRepositories,
        id: args.id,
        externalId: args.externalId,
        externalSource: args.externalSource,
        dryRun: args.dryRun,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'history') {
    return runTaskHistoryCommand(
      {
        command: 'task',
        subcommand: 'history',
        help: args.help,
        json: args.json,
        path: args.path,
        id: args.id,
        externalId: args.externalId,
        externalSource: args.externalSource,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'import-beads') {
    return runTaskImportBeadsCommand(
      {
        command: 'task',
        subcommand: 'import-beads',
        help: args.help,
        json: args.json,
        path: args.path,
        file: args.file,
        closeMissing: args.closeMissing,
        dryRun: args.dryRun,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'sync-beads') {
    return runTaskSyncBeadsCommand(
      {
        command: 'task',
        subcommand: 'sync-beads',
        help: args.help,
        json: args.json,
        path: args.path,
        repository: args.repository,
        allRepositories: args.allRepositories,
        closeMissing: args.closeMissing,
        dryRun: args.dryRun,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'diff-beads') {
    return runTaskDiffBeadsCommand(
      {
        command: 'task',
        subcommand: 'diff-beads',
        help: args.help,
        json: args.json,
        path: args.path,
        file: args.file,
        repository: args.repository,
        allRepositories: args.allRepositories,
        closeMissing: args.closeMissing,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'export-beads') {
    return runTaskExportBeadsCommand(
      {
        command: 'task',
        subcommand: 'export-beads',
        help: args.help,
        json: args.json,
        path: args.path,
        file: args.file,
      },
      runtimeContext,
    )
  }

  if (args.command === 'task' && args.subcommand === 'suggest-scan') {
    return runTaskSuggestScanCommand(
      {
        command: 'task',
        subcommand: 'suggest-scan',
        help: args.help,
        json: args.json,
        path: args.path,
      },
      runtimeContext,
    )
  }

  if (args.command === 'config' && args.subcommand === 'set-language') {
    return runConfigSetLanguageCommand(
      {
        command: 'config',
        subcommand: 'set-language',
        help: args.help,
        json: args.json,
        lang: args.lang,
      },
      runtimeContext,
    )
  }

  if (args.command === 'control-plane' && args.subcommand === 'overview') {
    return runControlPlaneOverviewCommand(
      {
        command: 'control-plane',
        subcommand: 'overview',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'platforms' && args.subcommand === 'list') {
    return runPlatformsListCommand(
      {
        command: 'platforms',
        subcommand: 'list',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'platforms' && args.subcommand === 'inspect') {
    return runPlatformsInspectCommand(
      {
        command: 'platforms',
        subcommand: 'inspect',
        help: args.help,
        json: args.json,
        platform: args.platform,
      },
      runtimeContext,
    )
  }

  if (args.command === 'platforms' && args.subcommand === 'capabilities') {
    return runPlatformsCapabilitiesCommand(
      {
        command: 'platforms',
        subcommand: 'capabilities',
        help: args.help,
        json: args.json,
        platform: args.platform,
      },
      runtimeContext,
    )
  }

  if (args.command === 'platforms' && args.subcommand === 'doctor') {
    return runPlatformsDoctorCommand(
      {
        command: 'platforms',
        subcommand: 'doctor',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'platforms' && args.subcommand === 'resolve') {
    return runPlatformsResolveCommand(
      {
        command: 'platforms',
        subcommand: 'resolve',
        help: args.help,
        json: args.json,
        path: args.path,
        profile: args.profile,
      },
      runtimeContext,
    )
  }

  if (args.command === 'skills' && args.subcommand === 'list') {
    return runSkillsListCommand(
      {
        command: 'skills',
        subcommand: 'list',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'skills' && args.subcommand === 'inspect') {
    return runSkillsInspectCommand(
      {
        command: 'skills',
        subcommand: 'inspect',
        help: args.help,
        json: args.json,
        skill: args.skill,
      },
      runtimeContext,
    )
  }

  if (args.command === 'skills' && args.subcommand === 'doctor') {
    return runSkillsDoctorCommand(
      {
        command: 'skills',
        subcommand: 'doctor',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'mcp' && args.subcommand === 'list') {
    return runMcpListCommand(
      {
        command: 'mcp',
        subcommand: 'list',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  if (args.command === 'mcp' && args.subcommand === 'inspect') {
    return runMcpInspectCommand(
      {
        command: 'mcp',
        subcommand: 'inspect',
        help: args.help,
        json: args.json,
        server: args.server,
      },
      runtimeContext,
    )
  }

  if (args.command === 'mcp' && args.subcommand === 'doctor') {
    return runMcpDoctorCommand(
      {
        command: 'mcp',
        subcommand: 'doctor',
        help: args.help,
        json: args.json,
      },
      runtimeContext,
    )
  }

  return {
    exitCode: 1,
    stdout: messages.common.unknownCommand,
  }
}
