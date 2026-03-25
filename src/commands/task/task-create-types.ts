/**
 * @file src/commands/task/task-create-types.ts
 * @author michaeljou
 */

import type { CliRuntimeContext } from '@/cli/runtime-context.js'
import type { readGlobalConfig } from '@/config/global-config.js'
import type { bootstrapDatabase } from '@/db/bootstrap.js'
import type { createTaskStore } from '@/db/task-store.js'
import type { resolveManagedProject } from '@/project/resolve-project.js'

/**
 * `task create` 的标准化参数。
 *
 * 这组字段不是数据库结构，而是 CLI 协议层的输入模型。
 * 解析器先把命令行 flag 折叠为这份对象，再由命令处理器决定如何映射到持久化模型。
 */
export type TaskCreateArgs = {
  /** 顶层命令标识，用于主分发器确认这是一条 task 命令。 */
  command: 'task'
  /** 二级命令标识，用于 task 域内继续路由到 create。 */
  subcommand: 'create'
  /** 当为 true 时只输出帮助，不真正写入任务。 */
  help: boolean
  /** 项目根目录覆盖值；缺省时从当前工作目录向上解析受管项目。 */
  path?: string
  /** 任务标题，是任务列表中的主展示字段，也是创建时唯一必填字段。 */
  title?: string
  /** 任务描述，供人工补充上下文，可为空。 */
  description?: string
  /** 优先级用于人工排序和后续调度，不直接驱动状态流转。 */
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  /** 任务类型描述任务性质，主要用于展示、筛选和后续编排策略扩展。 */
  taskType: 'generic' | 'frontend' | 'backend' | 'cross_repo' | 'docs' | 'init'
  /** 仓库选择器，可传仓库名或路径，用于把任务绑定到单一仓库目标。 */
  repository?: string
}

/**
 * 任务创建命令使用的可注入依赖。
 *
 * 这里显式列出依赖，而不是直接复用全局 context，
 * 是为了让每个命令只声明自己真正需要的 IO 能力，方便测试和后续重构。
 */
export type TaskCreateDependencies = {
  readGlobalConfig: typeof readGlobalConfig
  resolveManagedProject: typeof resolveManagedProject
  bootstrapDatabase: typeof bootstrapDatabase
  createTaskStore: typeof createTaskStore
}

/**
 * 执行任务创建命令时使用的运行时上下文。
 *
 * `dependencies` 只在测试、故障注入和局部替换真实实现时使用，
 * 正常 CLI 执行路径下会回退到命令文件内部定义的默认依赖。
 */
export type TaskCreateContext = CliRuntimeContext & {
  dependencies?: Partial<TaskCreateDependencies>
}
