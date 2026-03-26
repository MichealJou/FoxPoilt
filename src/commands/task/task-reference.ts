/**
 * @file src/commands/task/task-reference.ts
 * @author michaeljou
 */

import type { createTaskStore } from '@/db/task-store.js'

/**
 * 当前 CLI 支持的外部任务来源键。
 *
 * 现阶段外部协作链路只落地了 `Beads`，因此这里先保持最小集合。
 * 等后续接入更多来源时，再在这个联合类型上增量扩展即可。
 */
export type ExternalTaskSource = 'beads'

/**
 * 单任务命令共用的任务身份输入。
 *
 * 这里同时支持两类定位方式：
 * - `id`：FoxPilot 内部主键，适合脚本或底层排障；
 * - `externalId`：外部系统中的稳定任务号，适合人工操作导入任务。
 *
 * 当前如果只给出 `externalId`，则默认按 `beads` 来源解析。
 */
export type TaskReferenceArgs = {
  /** FoxPilot 内部任务主键，例如 `task:...`。 */
  id?: string
  /** 外部系统中的稳定任务号，例如 `BEADS-1001`。 */
  externalId?: string
  /** 外部任务来源键；当前默认值为 `beads`。 */
  externalSource?: ExternalTaskSource
}

/**
 * 成功解析后的统一任务定位结果。
 *
 * `referenceLines` 供命令层直接拼接到输出文本中，
 * 这样通过外部任务号操作任务时，终端也能明确显示当前命中的外部引用。
 */
export type ResolvedTaskReference = {
  /** 最终写入查询层和更新层的内部任务主键。 */
  taskId: string
  /** 当前命中引用的外部信息；内部 ID 路径下为空。 */
  referenceLines: string[]
}

type TaskReferenceMessages = {
  /** 当内部 ID 与外部任务号都缺失时使用的错误消息。 */
  idRequired: string
  /** 当任务未命中时使用的错误消息。 */
  taskNotFound: string
}

/**
 * 统一解析单任务命令的目标任务。
 *
 * 设计逻辑：
 * 1. 优先保留历史兼容的 `--id` 行为；
 * 2. 当没有内部 `id` 时，再尝试 `externalSource + externalId`；
 * 3. 外部来源默认 `beads`，让导入任务的人工操作更短；
 * 4. 错误消息在这里集中生成，避免多个命令各写一套分支。
 */
export function resolveTaskReference(input: {
  args: TaskReferenceArgs
  projectId: string
  taskStore: ReturnType<typeof createTaskStore>
  messages: TaskReferenceMessages
}): { ok: true; value: ResolvedTaskReference } | { ok: false; stdout: string } {
  const taskId = input.args.id?.trim()
  if (taskId) {
    return {
      ok: true,
      value: {
        taskId,
        referenceLines: [],
      },
    }
  }

  const externalId = input.args.externalId?.trim()
  if (!externalId) {
    return {
      ok: false,
      stdout: input.messages.idRequired,
    }
  }

  const externalSource = input.args.externalSource ?? 'beads'
  const task = input.taskStore.getTaskByExternalRef({
    projectId: input.projectId,
    externalSource,
    externalId,
  })

  if (!task) {
    return {
      ok: false,
      stdout: [
        input.messages.taskNotFound,
        `- externalSource: ${externalSource}`,
        `- externalId: ${externalId}`,
      ].join('\n'),
    }
  }

  return {
    ok: true,
    value: {
      taskId: task.id,
      referenceLines: [
        `- externalSource: ${task.external_source}`,
        `- externalId: ${task.external_id}`,
      ],
    },
  }
}
