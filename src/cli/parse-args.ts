/**
 * @file src/cli/parse-args.ts
 * @author michaeljou
 */

import type { InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * 解析后的 CLI 参数，会被标准化为 `main` 使用的命令模型。
 *
 * 这里的字段是“命令协议模型”，不是某个单一命令的最终参数。
 * 主入口会先拿到这份宽模型，再根据 `command` / `subcommand` 收窄到具体命令类型。
 */
export type CliArgs = {
  /** 如 `init`、`task`、`config` 这样的顶层命令名。 */
  command?: string
  /** 分组命令使用的二级命令名。 */
  subcommand?: string
  /** 是否直接输出帮助并短路正常执行流程。 */
  help: boolean
  /** 可选的项目根目录覆盖值。 */
  path?: string
  /** 可选的项目标识或显示来源名称。 */
  name?: string
  /** 可选的工作区根目录覆盖值。 */
  workspaceRoot?: string
  /** init 执行模式。 */
  mode: 'interactive' | 'non-interactive'
  /** 在 init 过程中是否跳过仓库扫描。 */
  noScan: boolean
  /** 手动任务标题。 */
  title?: string
  /** 手动任务描述。 */
  description?: string
  /** 是否显式清空已有任务描述。 */
  clearDescription: boolean
  /** 任务优先级；未提供时交给具体命令决定默认值。 */
  priority?: 'P0' | 'P1' | 'P2' | 'P3'
  /** 用于路由和展示的任务类型分类；未提供时由具体命令决定默认值。 */
  taskType?: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init'
  /** 用于限定任务作用范围的可选仓库选择器。 */
  repository?: string
  /** 可选的状态过滤条件或目标状态。 */
  status?: 'todo' | 'analyzing' | 'awaiting_plan_confirm' | 'executing' | 'awaiting_result_confirm' | 'done' | 'blocked' | 'cancelled'
  /** 可选的任务来源过滤条件。 */
  source?: 'manual' | 'beads_sync' | 'scan_suggestion'
  /** 详情和状态更新命令使用的可选任务标识。 */
  id?: string
  /** 外部系统中的稳定任务号，用于直接操作导入任务。 */
  externalId?: string
  /** 外部任务来源键；当前由命令层决定默认值。 */
  externalSource?: 'beads'
  /** 任务当前责任执行器。 */
  executor?: 'codex' | 'beads' | 'none'
  /** 配置命令使用的可选交互语言。 */
  lang?: InterfaceLanguage
  /** 从外部快照导入任务时使用的文件路径。 */
  file?: string
  /** 是否在导入后收口当前快照中已经缺失的外部任务。 */
  closeMissing: boolean
  /** 是否只预演导入结果而不写入数据库。 */
  dryRun: boolean
}

/**
 * 将原始 argv 解析为以命令为中心的对象，让命令处理器专注于业务行为。
 *
 * 当前实现故意保持轻量，不引入额外参数库，原因是：
 * - 现阶段命令数量有限；
 * - 我们需要完全掌控别名、默认值和失败容忍策略；
 * - 测试里可以直接构造 argv 覆盖各种边界情况。
 *
 * 这里采用“宽松解析”策略：
 * - 合法枚举会被收进返回对象；
 * - 非法枚举会被忽略为 `undefined` 或默认值；
 * - 真正的必填校验交给具体命令处理器负责。
 *
 * 这样做可以把“语法解析”和“业务校验”拆开，避免参数解析器承担过多命令语义。
 */
export function parseArgs(argv: string[]): CliArgs {
  const [command] = argv
  const subcommand = command === 'task' || command === 'config' ? argv[1] : undefined
  const rest = command === 'task' || command === 'config' ? argv.slice(2) : argv.slice(1)
  let path: string | undefined
  let name: string | undefined
  let workspaceRoot: string | undefined
  let mode: 'interactive' | 'non-interactive' = 'interactive'
  let noScan = false
  let title: string | undefined
  let description: string | undefined
  let clearDescription = false
  let priority: 'P0' | 'P1' | 'P2' | 'P3' | undefined
  let taskType: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init' | undefined
  let repository: string | undefined
  let id: string | undefined
  let externalId: string | undefined
  let externalSource: 'beads' | undefined
  let executor: 'codex' | 'beads' | 'none' | undefined
  let lang: InterfaceLanguage | undefined
  let file: string | undefined
  let closeMissing = false
  let dryRun = false
  let status:
    | 'todo'
    | 'analyzing'
    | 'awaiting_plan_confirm'
    | 'executing'
    | 'awaiting_result_confirm'
    | 'done'
    | 'blocked'
    | 'cancelled'
    | undefined
  let source: 'manual' | 'beads_sync' | 'scan_suggestion' | undefined

  /**
   * `task` 和 `config` 是分组命令，因此要跳过二级命令后再扫描 flag。
   * `init` 这类单级命令则从第一个 flag 开始扫描即可。
   */
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index]

    if (value === '--path') {
      path = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--name') {
      name = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--title') {
      title = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--description') {
      description = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--clear-description') {
      clearDescription = true
      continue
    }

    if (value === '--workspace-root') {
      workspaceRoot = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--mode') {
      const nextValue = rest[index + 1]
      if (nextValue === 'interactive' || nextValue === 'non-interactive') {
        mode = nextValue
      }
      index += 1
      continue
    }

    if (value === '--no-scan') {
      noScan = true
    }

    if (value === '--priority') {
      const nextValue = rest[index + 1]
      if (nextValue === 'P0' || nextValue === 'P1' || nextValue === 'P2' || nextValue === 'P3') {
        priority = nextValue
      }
      index += 1
      continue
    }

    if (value === '--task-type') {
      const nextValue = rest[index + 1]
      if (
        nextValue === 'generic' ||
        nextValue === 'frontend' ||
        nextValue === 'backend' ||
        nextValue === 'cross_repo' ||
        nextValue === 'docs' ||
        nextValue === 'init'
      ) {
        taskType = nextValue
      }
      index += 1
      continue
    }

    if (value === '--repository') {
      repository = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--id') {
      id = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--external-id') {
      externalId = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--external-source') {
      const nextValue = rest[index + 1]
      if (nextValue === 'beads') {
        externalSource = nextValue
      }
      index += 1
      continue
    }

    if (value === '--executor') {
      const nextValue = rest[index + 1]
      if (nextValue === 'codex' || nextValue === 'beads' || nextValue === 'none') {
        executor = nextValue
      }
      index += 1
      continue
    }

    if (value === '--status') {
      const nextValue = rest[index + 1]
      if (
        nextValue === 'todo' ||
        nextValue === 'analyzing' ||
        nextValue === 'awaiting_plan_confirm' ||
        nextValue === 'executing' ||
        nextValue === 'awaiting_result_confirm' ||
        nextValue === 'done' ||
        nextValue === 'blocked' ||
        nextValue === 'cancelled'
      ) {
        status = nextValue
      }
      index += 1
      continue
    }

    if (value === '--source') {
      const nextValue = rest[index + 1]
      if (nextValue === 'manual' || nextValue === 'beads_sync' || nextValue === 'scan_suggestion') {
        source = nextValue
      }
      index += 1
      continue
    }

    if (value === '--lang') {
      const nextValue = rest[index + 1]
      if (nextValue === 'zh-CN' || nextValue === 'en-US' || nextValue === 'ja-JP') {
        lang = nextValue
      }
      index += 1
      continue
    }

    if (value === '--file') {
      file = rest[index + 1]
      index += 1
      continue
    }

    if (value === '--close-missing') {
      closeMissing = true
      continue
    }

    if (value === '--dry-run') {
      dryRun = true
    }
  }

  return {
    command,
    subcommand,
    help: rest.includes('--help') || rest.includes('-h'),
    path,
    name,
    workspaceRoot,
    mode,
    noScan,
    title,
    description,
    clearDescription,
    priority,
    taskType,
    repository,
    status,
    source,
    id,
    externalId,
    externalSource,
    executor,
    lang,
    file,
    closeMissing,
    dryRun,
  }
}
