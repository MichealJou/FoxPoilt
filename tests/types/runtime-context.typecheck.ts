import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { ConfigSetLanguageContext, ConfigSetLanguageDependencies } from '@/commands/config/config-types.js'
import type { InitCommandContext, InitCommandDependencies } from '@/commands/init/init-types.js'
import type { TaskCreateContext, TaskCreateDependencies } from '@/commands/task/task-create-types.js'
import type { TaskHistoryContext, TaskHistoryDependencies } from '@/commands/task/task-history-types.js'
import type { TaskListContext, TaskListDependencies } from '@/commands/task/task-list-types.js'
import type { TaskShowContext, TaskShowDependencies } from '@/commands/task/task-show-types.js'
import type {
  TaskUpdateStatusContext,
  TaskUpdateStatusDependencies,
} from '@/commands/task/task-update-status-types.js'
import type { InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * 这组类型断言不参与运行时测试，只用于锁定上下文类型的编译期结构。
 *
 * 当前最重要的约束有两条：
 * 1. 各命令上下文必须稳定暴露 `interfaceLanguage`；
 * 2. 各命令上下文里的 `dependencies` 必须收敛成命令自己的依赖集合，
 *    不能退化回宽泛的 `Record<string, unknown>`。
 */

type Assert<T extends true> = T

type _BaseContextLanguage = Assert<CliRuntimeContext extends { interfaceLanguage: InterfaceLanguage } ? true : false>
type _InitContextLanguage = Assert<InitCommandContext extends { interfaceLanguage: InterfaceLanguage } ? true : false>
type _ConfigContextLanguage = Assert<
  ConfigSetLanguageContext extends { interfaceLanguage: InterfaceLanguage } ? true : false
>
type _TaskCreateContextLanguage = Assert<
  TaskCreateContext extends { interfaceLanguage: InterfaceLanguage } ? true : false
>
type _TaskListContextLanguage = Assert<TaskListContext extends { interfaceLanguage: InterfaceLanguage } ? true : false>
type _TaskShowContextLanguage = Assert<TaskShowContext extends { interfaceLanguage: InterfaceLanguage } ? true : false>
type _TaskHistoryContextLanguage = Assert<
  TaskHistoryContext extends { interfaceLanguage: InterfaceLanguage } ? true : false
>
type _TaskUpdateStatusContextLanguage = Assert<
  TaskUpdateStatusContext extends { interfaceLanguage: InterfaceLanguage } ? true : false
>

type _InitContextDependencies = Assert<
  InitCommandContext extends { dependencies?: Partial<InitCommandDependencies> } ? true : false
>
type _ConfigContextDependencies = Assert<
  ConfigSetLanguageContext extends { dependencies?: Partial<ConfigSetLanguageDependencies> } ? true : false
>
type _TaskCreateContextDependencies = Assert<
  TaskCreateContext extends { dependencies?: Partial<TaskCreateDependencies> } ? true : false
>
type _TaskListContextDependencies = Assert<
  TaskListContext extends { dependencies?: Partial<TaskListDependencies> } ? true : false
>
type _TaskShowContextDependencies = Assert<
  TaskShowContext extends { dependencies?: Partial<TaskShowDependencies> } ? true : false
>
type _TaskHistoryContextDependencies = Assert<
  TaskHistoryContext extends { dependencies?: Partial<TaskHistoryDependencies> } ? true : false
>
type _TaskUpdateStatusContextDependencies = Assert<
  TaskUpdateStatusContext extends { dependencies?: Partial<TaskUpdateStatusDependencies> } ? true : false
>
