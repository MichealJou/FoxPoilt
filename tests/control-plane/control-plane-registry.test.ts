import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  collectControlPlaneOverview,
  collectMcpRegistry,
  collectSkillRegistry,
} from '@control-plane/control-plane-registry.js'
import { createTempDir, removeTempDir } from '@tests/helpers/tmp-dir.js'

describe('control-plane registry', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const target = tempDirs.pop()
      if (target) {
        await removeTempDir(target)
      }
    }
  })

  it('scans skill directories and marks missing manifests as degraded', async () => {
    const homeDir = await createTempDir('foxpilot-control-plane-home-')
    tempDirs.push(homeDir)

    const skillsRoot = path.join(homeDir, '.agents', 'skills')
    await mkdir(path.join(skillsRoot, 'architecture-designer-0.1.0'), { recursive: true })
    await writeFile(
      path.join(skillsRoot, 'architecture-designer-0.1.0', 'SKILL.md'),
      '# architecture-designer\n',
    )
    await mkdir(path.join(skillsRoot, 'broken-skill'), { recursive: true })

    const items = await collectSkillRegistry({ homeDir })

    expect(items).toHaveLength(2)
    expect(items.find((item) => item.skillId === 'architecture-designer')?.status).toBe('ready')
    expect(items.find((item) => item.skillId === 'broken-skill')?.status).toBe('degraded')
  })

  it('parses codex mcp config and aggregates overview counts', async () => {
    const homeDir = await createTempDir('foxpilot-control-plane-home-')
    tempDirs.push(homeDir)

    await mkdir(path.join(homeDir, '.codex'), { recursive: true })
    await writeFile(
      path.join(homeDir, '.codex', 'config.toml'),
      [
        '[mcp_servers.github]',
        'type = "http"',
        'url = "https://api.githubcopilot.com/mcp/"',
        '',
        '[mcp_servers.filesystem]',
        'type = "stdio"',
        'command = "npx"',
        'args = [ "-y", "@modelcontextprotocol/server-filesystem" ]',
        '',
        '[mcp_servers.filesystem.env]',
        'ROOT = "/tmp"',
      ].join('\n'),
    )

    const mcpItems = await collectMcpRegistry({ homeDir })
    expect(mcpItems).toHaveLength(2)
    expect(mcpItems.find((item) => item.serverId === 'github')?.transport).toBe('http')
    expect(mcpItems.find((item) => item.serverId === 'filesystem')?.envSummary).toBe(
      '配置了 1 个环境变量',
    )

    const overview = await collectControlPlaneOverview(
      { homeDir },
      {
        detectPlatformAvailability: async (platformId) => ({
          platformId,
          available: platformId === 'codex',
          command: platformId === 'codex' ? 'codex' : undefined,
        }),
        runCommand: async () => ({
          ok: true,
          stdout: 'codex 1.2.0\n',
          stderr: '',
        }),
      },
    )

    expect(overview.summary.platformCount).toBe(4)
    expect(overview.summary.mcpCount).toBe(2)
    expect(overview.summary.readyCount).toBeGreaterThan(0)
  })
})
