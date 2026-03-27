/**
 * @file src/commands/task/task-export-beads-command.ts
 * @author michaeljou
 */

import path from 'node:path'

import { toJsonErrorOutput, toJsonSuccessOutput } from '@/cli/json-output.js'
import type { CliResult } from '@/commands/init/init-types.js'
import { writeJsonFile } from '@infra/core/json-file.js'
import { resolveGlobalDatabasePath } from '@infra/core/paths.js'
import { bootstrapDatabase } from '@infra/db/bootstrap.js'
import { createTaskStore } from '@infra/db/task-store.js'
import { getMessages } from '@/i18n/messages.js'
import {
  ProjectNotInitializedError,
  resolveManagedProject,
} from '@infra/project/resolve-project.js'
import { buildBeadsExportSnapshot } from '@integrations/sync/beads-import-service.js'

import type {
  TaskExportBeadsArgs,
  TaskExportBeadsContext,
  TaskExportBeadsDependencies,
} from '@/commands/task/task-export-beads-types.js'

/**
 * 解析导出命令使用的默认依赖集合。
 */
function getDependencies(
  overrides: Partial<TaskExportBeadsDependencies> = {},
): TaskExportBeadsDependencies {
  return {
    writeJsonFile,
    resolveManagedProject,
    bootstrapDatabase,
    createTaskStore,
    ...overrides,
  }
}

/**
 * 构造帮助文本。
 *
 * 导出命令刻意保持单一职责：只把当前项目中的 Beads 同步任务写出为本地快照。
 */
function buildHelpText(language: Parameters<typeof getMessages>[0]): string {
  const messages = getMessages(language)

  return [
    messages.taskExportBeads.helpDescription,
    '',
    'foxpilot task export-beads',
    'fp task export-beads',
    '--file <json-file>',
    '--path <project-root>',
  ].join('\n')
}

/**
 * 导出当前项目里的 Beads 同步任务。
 *
 * 设计逻辑：
 * 1. 查询层先只返回“当前项目、可导出”的最小投影；
 * 2. 同步层再把本地状态回映射成快照协议；
 * 3. 命令层最后统一负责写盘和用户可读输出。
 *
 * 这样职责分层更清楚：
 * - store 负责查什么；
 * - sync service 负责怎么映射；
 * - command 负责怎样和 CLI 交互。
 */
export async function runTaskExportBeadsCommand(
  args: TaskExportBeadsArgs,
  context: TaskExportBeadsContext,
): Promise<CliResult> {
  const messages = getMessages(context.interfaceLanguage)
  const commandName = 'task export-beads'

  if (args.help) {
    return {
      exitCode: 0,
      stdout: buildHelpText(context.interfaceLanguage),
    }
  }

  if (!args.file?.trim()) {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'FILE_REQUIRED',
            message: messages.taskExportBeads.fileRequired,
          })
        : messages.taskExportBeads.fileRequired,
    }
  }

  const dependencies = getDependencies(context.dependencies)

  let managedProject
  try {
    managedProject = await dependencies.resolveManagedProject({
      cwd: context.cwd,
      projectPath: args.path,
    })
  } catch (error) {
    if (error instanceof ProjectNotInitializedError) {
      return {
        exitCode: 1,
        stdout: args.json
          ? toJsonErrorOutput(commandName, {
              code: 'PROJECT_NOT_INITIALIZED',
              message: messages.taskExportBeads.projectNotInitialized,
              details: {
                projectRoot: error.projectRoot,
              },
            })
          : `${messages.taskExportBeads.projectNotInitialized}\n- projectRoot: ${error.projectRoot}`,
      }
    }

    throw error
  }

  const dbPath = resolveGlobalDatabasePath(context.homeDir)
  let db
  try {
    db = await dependencies.bootstrapDatabase(dbPath)
  } catch {
    return {
      exitCode: 4,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'DATABASE_BOOTSTRAP_FAILED',
            message: messages.taskExportBeads.dbBootstrapFailed,
            details: {
              dbPath,
            },
          })
        : `${messages.taskExportBeads.dbBootstrapFailed}\n- ${dbPath}`,
    }
  }

  const taskStore = dependencies.createTaskStore(db)
  const rows = taskStore.listExportableBeadsTasks({
    projectId: `project:${managedProject.projectRoot}`,
  })
  db.close()

  const snapshot = buildBeadsExportSnapshot(rows)
  const filePath = path.resolve(context.cwd, args.file)

  try {
    await dependencies.writeJsonFile(filePath, snapshot.exported)
  } catch {
    return {
      exitCode: 1,
      stdout: args.json
        ? toJsonErrorOutput(commandName, {
            code: 'WRITE_FAILED',
            message: messages.taskExportBeads.writeFailed,
            details: {
              filePath,
            },
          })
        : `${messages.taskExportBeads.writeFailed}\n- ${filePath}`,
    }
  }

  const data = {
    projectRoot: managedProject.projectRoot,
    file: filePath,
    exported: snapshot.exported,
    rejected: snapshot.rejected,
  }

  if (args.json) {
    return {
      exitCode: 0,
      stdout: toJsonSuccessOutput(commandName, data),
    }
  }

  return {
    exitCode: 0,
    stdout: [
      messages.taskExportBeads.completed,
      `- projectRoot: ${managedProject.projectRoot}`,
      `- file: ${filePath}`,
      `- exported: ${snapshot.exported.length}`,
      `- rejected: ${snapshot.rejected.length}`,
      ...(snapshot.rejected.length > 0
        ? ['', messages.taskExportBeads.rejectedTitle, ...snapshot.rejected.map((item) => `- ${item}`)]
        : []),
    ].join('\n'),
  }
}
