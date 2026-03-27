/**
 * @file src/foundation/foundation-installer.ts
 * @author michaeljou
 */

import { access } from 'node:fs/promises'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  getDefaultFoundationPack,
  getFoundationToolMetadata,
  type FoundationPack,
  type FoundationTool,
} from '@foxpilot/integrations/foundation/foundation-profile.js'
import { installFoundationTool } from '@foxpilot/integrations/foundation/foundation-official-installers.js'

const execFileAsync = promisify(execFile)

export type FoundationToolDetection = {
  version: string | null
}

export type FoundationToolStatus = {
  tool: FoundationTool
  checkTarget: string
  status: 'ready' | 'missing'
  version: string | null
}

export type FoundationInspectionResult = {
  packId: FoundationPack['id']
  items: FoundationToolStatus[]
  ready: FoundationTool[]
  missing: FoundationTool[]
}

export type EnsureFoundationPackDependencies = {
  detectTool: (
    tool: FoundationTool,
    context: { homeDir: string },
  ) => Promise<FoundationToolDetection | null>
}

export type SetupFoundationPackDependencies = EnsureFoundationPackDependencies & {
  installOfficialTool: (
    tool: FoundationTool,
    context: { homeDir: string; platform: NodeJS.Platform },
  ) => Promise<void>
}

export type FoundationSetupResult = FoundationInspectionResult & {
  installed: FoundationTool[]
}

/**
 * 默认工具探测策略：
 * 1. 调当前工具的 `--version`；
 * 2. 成功就视为 ready；
 * 3. 命令不存在或执行失败则视为 missing。
 *
 * 第一批先做最小探测，不在这里直接触发安装。
 */
export async function detectFoundationTool(
  tool: FoundationTool,
  context: { homeDir: string },
): Promise<FoundationToolDetection | null> {
  const metadata = getFoundationToolMetadata(tool)

  if (metadata.detection.kind === 'filesystem') {
    for (const targetPath of metadata.detection.paths({ homeDir: context.homeDir })) {
      try {
        await access(targetPath)
        return {
          version: null,
        }
      } catch {
        continue
      }
    }

    return null
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      metadata.detection.command,
      metadata.detection.versionArgs,
    )
    const versionText = [stdout, stderr]
      .map((value) => value.trim())
      .find((value) => value.length > 0)

    return {
      version: versionText ?? null,
    }
  } catch {
    return null
  }
}

export async function ensureFoundationPack(
  dependencies: Partial<EnsureFoundationPackDependencies> & {
    homeDir?: string
  } = {},
): Promise<FoundationInspectionResult> {
  const pack = getDefaultFoundationPack()
  const detectTool = dependencies.detectTool ?? detectFoundationTool
  const homeDir = dependencies.homeDir ?? os.homedir()

  const items = await Promise.all(
    pack.items.map(async (tool) => {
      const metadata = getFoundationToolMetadata(tool)
      const detected = await detectTool(tool, { homeDir })

      return {
        tool,
        checkTarget:
          metadata.detection.kind === 'command'
            ? metadata.detection.command
            : metadata.detection.paths({ homeDir }).join(', '),
        status: detected ? 'ready' : 'missing',
        version: detected?.version ?? null,
      } satisfies FoundationToolStatus
    }),
  )

  return {
    packId: pack.id,
    items,
    ready: items.filter((item) => item.status === 'ready').map((item) => item.tool),
    missing: items.filter((item) => item.status === 'missing').map((item) => item.tool),
  }
}

export async function setupFoundationPack(
  dependencies: Partial<SetupFoundationPackDependencies> & {
    homeDir?: string
    platform?: NodeJS.Platform
  } = {},
): Promise<FoundationSetupResult> {
  const homeDir = dependencies.homeDir ?? os.homedir()
  const platform = dependencies.platform ?? process.platform
  const detectTool = dependencies.detectTool ?? detectFoundationTool
  const installOfficialTool = dependencies.installOfficialTool ?? installFoundationTool

  const initial = await ensureFoundationPack({
    homeDir,
    detectTool,
  })

  const installed: FoundationTool[] = []

  for (const tool of initial.missing) {
    await installOfficialTool(tool, { homeDir, platform })
    installed.push(tool)
  }

  const afterSetup = await ensureFoundationPack({
    homeDir,
    detectTool,
  })

  return {
    ...afterSetup,
    installed,
  }
}
