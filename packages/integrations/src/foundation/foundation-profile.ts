/**
 * @file src/foundation/foundation-profile.ts
 * @author michaeljou
 */

/**
 * 安装阶段基础组合当前固定包含的工具键。
 */
export type FoundationTool = 'beads' | 'superpowers'

/**
 * 基础组合内单个工具的静态元数据。
 */
export type FoundationToolMetadata = {
  tool: FoundationTool
  displayName: string
  detection:
    | {
        kind: 'command'
        command: string
        versionArgs: string[]
      }
    | {
        kind: 'filesystem'
        paths: (input: { homeDir: string }) => string[]
      }
}

/**
 * FoxPilot 第二阶段的系统级基础组合定义。
 *
 * 当前先固定为 `Beads + Superpowers`，
 * 后续如果要扩更多组合，也应该在这里集中声明。
 */
export type FoundationPack = {
  id: 'default-foundation'
  name: string
  items: FoundationTool[]
}

const foundationToolMetadata: Record<FoundationTool, FoundationToolMetadata> = {
  beads: {
    tool: 'beads',
    displayName: 'Beads',
    detection: {
      kind: 'command',
      command: 'bd',
      versionArgs: ['--version'],
    },
  },
  superpowers: {
    tool: 'superpowers',
    displayName: 'Superpowers',
    detection: {
      kind: 'filesystem',
      paths: ({ homeDir }) => [
        `${homeDir}/.codex/superpowers`,
        `${homeDir}/.agents/skills/superpowers`,
      ],
    },
  },
}

export function getFoundationToolMetadata(tool: FoundationTool): FoundationToolMetadata {
  return foundationToolMetadata[tool]
}

export function getDefaultFoundationPack(): FoundationPack {
  return {
    id: 'default-foundation',
    name: 'Beads + Superpowers',
    items: ['beads', 'superpowers'],
  }
}
