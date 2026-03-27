import { access, readdir, readFile } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

import type {
  DetectablePlatformId,
  ProjectRoleId,
  ProjectStageId,
} from '@contracts/orchestration-contract.js'
import { detectPlatformAvailability } from '@runtime/orchestrators/platform-resolver.js'

export type ControlPlaneStatus = 'ready' | 'degraded' | 'unavailable'
export type ControlPlaneKind = 'platform' | 'skill' | 'mcp'

export type ControlPlaneRegistryItem = {
  id: string
  kind: ControlPlaneKind
  name: string
  source: string
  status: ControlPlaneStatus
  healthSummary: string | null
  lastCheckedAt: string | null
  availableActions: string[]
}

export type PlatformRegistryItem = ControlPlaneRegistryItem & {
  kind: 'platform'
  platformId: DetectablePlatformId
  version: string | null
  capabilities: string[]
  supportedStages: ProjectStageId[]
  recommendedRoles: ProjectRoleId[]
  detectReasons: string[]
  command: string | null
}

export type SkillRegistryItem = ControlPlaneRegistryItem & {
  kind: 'skill'
  skillId: string
  version: string | null
  installPath: string | null
  manifestPath: string | null
  enabled: boolean
}

export type MpcRegistryItem = ControlPlaneRegistryItem & {
  kind: 'mcp'
  serverId: string
  configPath: string | null
  command: string | null
  args: string[]
  enabled: boolean
  transport: 'stdio' | 'http' | 'unknown'
  url: string | null
  envSummary: string | null
}

export type ControlPlaneOverview = {
  summary: {
    platformCount: number
    skillCount: number
    mcpCount: number
    readyCount: number
    degradedCount: number
    unavailableCount: number
  }
  recentChecks: {
    platformDetectAt: string | null
    skillDoctorAt: string | null
    mcpDoctorAt: string | null
  }
  highlights: {
    degradedPlatforms: string[]
    degradedSkills: string[]
    unavailableMcpServers: string[]
  }
}

export type ControlPlaneRegistryDependencies = {
  detectPlatformAvailability: typeof detectPlatformAvailability
  readDir: typeof readdir
  readTextFile: typeof readFile
  pathExists: (targetPath: string) => Promise<boolean>
  now: () => string
  runCommand: (
    command: string,
    args: string[],
  ) => Promise<{ ok: boolean; stdout: string; stderr: string }>
}

const PLATFORM_CATALOG: Record<
  DetectablePlatformId,
  {
    name: string
    capabilities: string[]
    supportedStages: ProjectStageId[]
    recommendedRoles: ProjectRoleId[]
  }
> = {
  codex: {
    name: 'Codex',
    capabilities: ['design', 'review', 'document'],
    supportedStages: ['design'],
    recommendedRoles: ['designer'],
  },
  claude_code: {
    name: 'Claude Code',
    capabilities: ['implement', 'refactor', 'test-fix'],
    supportedStages: ['implement'],
    recommendedRoles: ['coder'],
  },
  qoder: {
    name: 'Qoder',
    capabilities: ['verify', 'audit'],
    supportedStages: ['verify'],
    recommendedRoles: ['tester'],
  },
  trae: {
    name: 'Trae',
    capabilities: ['repair', 'retry'],
    supportedStages: ['repair'],
    recommendedRoles: ['fixer'],
  },
}

function getDependencies(
  overrides: Partial<ControlPlaneRegistryDependencies> = {},
): ControlPlaneRegistryDependencies {
  return {
    detectPlatformAvailability,
    readDir: readdir,
    readTextFile: readFile,
    pathExists: async (targetPath: string) => {
      try {
        await access(targetPath, fsConstants.F_OK)
        return true
      } catch {
        return false
      }
    },
    now: () => new Date().toISOString(),
    runCommand: async (command: string, args: string[]) =>
      new Promise((resolve) => {
        const child = spawn(command, args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
        })

        let stdout = ''
        let stderr = ''

        child.stdout?.on('data', (chunk) => {
          stdout += String(chunk)
        })

        child.stderr?.on('data', (chunk) => {
          stderr += String(chunk)
        })

        child.once('error', () => {
          resolve({
            ok: false,
            stdout: '',
            stderr: '',
          })
        })

        child.once('close', (code) => {
          resolve({
            ok: code === 0,
            stdout,
            stderr,
          })
        })
      }),
    ...overrides,
  }
}

function normalizeSkillVersion(name: string): { skillId: string; version: string | null } {
  const match = name.match(/^(.*?)-(\d+\.\d+\.\d+(?:[-.\w]+)?)$/)
  if (!match) {
    return {
      skillId: name,
      version: null,
    }
  }

  return {
    skillId: match[1],
    version: match[2],
  }
}

function parseQuotedArray(value: string): string[] {
  const matches = value.match(/"((?:\\.|[^"])*)"/g) ?? []
  return matches.map((item) => item.slice(1, -1).replace(/\\"/g, '"'))
}

function parseVersionLine(output: string): string | null {
  const line = output
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.length > 0)

  return line ?? null
}

type ParsedMcpServer = {
  serverId: string
  configPath: string
  source: string
  command: string | null
  args: string[]
  transport: 'stdio' | 'http' | 'unknown'
  url: string | null
  envCount: number
}

function parseCodexMcpServers(input: { content: string; configPath: string }): ParsedMcpServer[] {
  const servers = new Map<string, ParsedMcpServer>()
  let currentServerId: string | null = null
  let currentMode: 'server' | 'env' | 'other' = 'other'

  for (const rawLine of input.content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (line.length === 0 || line.startsWith('#')) {
      continue
    }

    const serverSectionMatch = line.match(/^\[mcp_servers\.([A-Za-z0-9_-]+)\]$/)
    if (serverSectionMatch) {
      currentServerId = serverSectionMatch[1]
      currentMode = 'server'

      if (!servers.has(currentServerId)) {
        servers.set(currentServerId, {
          serverId: currentServerId,
          configPath: input.configPath,
          source: 'codex-config',
          command: null,
          args: [],
          transport: 'unknown',
          url: null,
          envCount: 0,
        })
      }

      continue
    }

    const nestedSectionMatch = line.match(/^\[mcp_servers\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\]$/)
    if (nestedSectionMatch) {
      currentServerId = nestedSectionMatch[1]
      currentMode = nestedSectionMatch[2] === 'env' ? 'env' : 'other'
      continue
    }

    if (!currentServerId) {
      continue
    }

    const current = servers.get(currentServerId)
    if (!current) {
      continue
    }

    if (currentMode === 'env') {
      if (line.includes('=')) {
        current.envCount += 1
      }
      continue
    }

    if (currentMode !== 'server') {
      continue
    }

    const stringMatch = line.match(/^([A-Za-z0-9_-]+)\s*=\s*"(.*)"$/)
    if (stringMatch) {
      const key = stringMatch[1]
      const value = stringMatch[2]

      if (key === 'command') {
        current.command = value
      } else if (key === 'type') {
        current.transport =
          value === 'stdio' || value === 'http' ? value : 'unknown'
      } else if (key === 'url') {
        current.url = value
      }

      continue
    }

    const argsMatch = line.match(/^args\s*=\s*\[(.*)\]$/)
    if (argsMatch) {
      current.args = parseQuotedArray(argsMatch[1])
    }
  }

  return [...servers.values()].sort((left, right) => left.serverId.localeCompare(right.serverId))
}

export async function collectPlatformRegistry(
  overrides: Partial<ControlPlaneRegistryDependencies> = {},
): Promise<PlatformRegistryItem[]> {
  const dependencies = getDependencies(overrides)
  const checkedAt = dependencies.now()
  const platformIds = Object.keys(PLATFORM_CATALOG) as DetectablePlatformId[]

  const items = await Promise.all(
    platformIds.map(async (platformId) => {
      const metadata = PLATFORM_CATALOG[platformId]
      const detection = await dependencies.detectPlatformAvailability(platformId)
      const version =
        detection.available && detection.command
          ? parseVersionLine((await dependencies.runCommand(detection.command, ['--version'])).stdout)
          : null

      return {
        id: platformId,
        kind: 'platform' as const,
        platformId,
        name: metadata.name,
        source: 'auto-detect',
        status: (detection.available ? 'ready' : 'unavailable') as ControlPlaneStatus,
        healthSummary: detection.available ? null : '未检测到可用命令入口',
        lastCheckedAt: checkedAt,
        availableActions: ['inspect', 'doctor', 'capabilities', 'resolve'],
        version,
        command: detection.command ?? null,
        capabilities: metadata.capabilities,
        supportedStages: metadata.supportedStages,
        recommendedRoles: metadata.recommendedRoles,
        detectReasons: detection.available
          ? [`检测到 ${detection.command ?? platformId} CLI`]
          : ['未检测到可用命令入口'],
      }
    }),
  )

  return items
}

export async function collectSkillRegistry(
  input: { homeDir: string },
  overrides: Partial<ControlPlaneRegistryDependencies> = {},
): Promise<SkillRegistryItem[]> {
  const dependencies = getDependencies(overrides)
  const checkedAt = dependencies.now()
  const roots = [
    {
      label: 'agents',
      path: path.join(input.homeDir, '.agents', 'skills'),
    },
    {
      label: 'codex',
      path: path.join(input.homeDir, '.codex', 'skills'),
    },
    {
      label: 'superpowers',
      path: path.join(input.homeDir, '.codex', 'superpowers', 'skills'),
    },
  ]

  const items = new Map<string, SkillRegistryItem>()

  for (const root of roots) {
    if (!(await dependencies.pathExists(root.path))) {
      continue
    }

    const entries = await dependencies.readDir(root.path, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const { skillId, version } = normalizeSkillVersion(entry.name)
      if (items.has(skillId)) {
        continue
      }

      const installPath = path.join(root.path, entry.name)
      const manifestPath = path.join(installPath, 'SKILL.md')
      const hasManifest = await dependencies.pathExists(manifestPath)

      items.set(skillId, {
        id: skillId,
        kind: 'skill',
        skillId,
        name: skillId,
        source: root.label,
        status: hasManifest ? 'ready' : 'degraded',
        healthSummary: hasManifest ? null : '缺少 SKILL.md',
        lastCheckedAt: checkedAt,
        availableActions: ['inspect', 'doctor', 'enable', 'disable'],
        version,
        installPath,
        manifestPath: hasManifest ? manifestPath : null,
        enabled: true,
      })
    }
  }

  return [...items.values()].sort((left, right) => left.skillId.localeCompare(right.skillId))
}

export async function collectMcpRegistry(
  input: { homeDir: string },
  overrides: Partial<ControlPlaneRegistryDependencies> = {},
): Promise<MpcRegistryItem[]> {
  const dependencies = getDependencies(overrides)
  const configPath = path.join(input.homeDir, '.codex', 'config.toml')

  if (!(await dependencies.pathExists(configPath))) {
    return []
  }

  const content = await dependencies.readTextFile(configPath, 'utf8')
  const checkedAt = dependencies.now()

  return parseCodexMcpServers({ content, configPath }).map((server) => {
    const ready = Boolean(server.url || server.command)

    return {
      id: server.serverId,
      kind: 'mcp',
      serverId: server.serverId,
      name: server.serverId,
      source: server.source,
      status: ready ? 'ready' : 'degraded',
      healthSummary: ready ? 'MCP 配置已识别' : 'MCP 配置缺少命令或 URL',
      lastCheckedAt: checkedAt,
      availableActions: ['inspect', 'doctor', 'repair', 'restart'],
      configPath: server.configPath,
      command: server.command,
      args: server.args,
      enabled: true,
      transport: server.transport,
      url: server.url,
      envSummary: server.envCount > 0 ? `配置了 ${server.envCount} 个环境变量` : null,
    }
  })
}

export async function collectControlPlaneOverview(
  input: { homeDir: string },
  overrides: Partial<ControlPlaneRegistryDependencies> = {},
): Promise<ControlPlaneOverview> {
  const [platforms, skills, mcps] = await Promise.all([
    collectPlatformRegistry(overrides),
    collectSkillRegistry(input, overrides),
    collectMcpRegistry(input, overrides),
  ])

  const allItems: Array<ControlPlaneRegistryItem> = [...platforms, ...skills, ...mcps]

  return {
    summary: {
      platformCount: platforms.length,
      skillCount: skills.length,
      mcpCount: mcps.length,
      readyCount: allItems.filter((item) => item.status === 'ready').length,
      degradedCount: allItems.filter((item) => item.status === 'degraded').length,
      unavailableCount: allItems.filter((item) => item.status === 'unavailable').length,
    },
    recentChecks: {
      platformDetectAt: platforms[0]?.lastCheckedAt ?? null,
      skillDoctorAt: skills[0]?.lastCheckedAt ?? null,
      mcpDoctorAt: mcps[0]?.lastCheckedAt ?? null,
    },
    highlights: {
      degradedPlatforms: platforms
        .filter((item) => item.status === 'degraded')
        .map((item) => item.platformId),
      degradedSkills: skills
        .filter((item) => item.status === 'degraded')
        .map((item) => item.skillId),
      unavailableMcpServers: mcps
        .filter((item) => item.status === 'unavailable')
        .map((item) => item.serverId),
    },
  }
}
