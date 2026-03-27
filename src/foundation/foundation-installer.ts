/**
 * @file src/foundation/foundation-installer.ts
 * @author michaeljou
 */

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  getDefaultFoundationPack,
  getFoundationToolMetadata,
  type FoundationPack,
  type FoundationTool,
} from '@/foundation/foundation-profile.js'

const execFileAsync = promisify(execFile)

export type FoundationToolDetection = {
  version: string | null
}

export type FoundationToolStatus = {
  tool: FoundationTool
  executable: string
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
  detectTool: (tool: FoundationTool) => Promise<FoundationToolDetection | null>
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
): Promise<FoundationToolDetection | null> {
  const metadata = getFoundationToolMetadata(tool)

  try {
    const { stdout, stderr } = await execFileAsync(metadata.executable, metadata.versionArgs)
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
  dependencies: Partial<EnsureFoundationPackDependencies> = {},
): Promise<FoundationInspectionResult> {
  const pack = getDefaultFoundationPack()
  const detectTool = dependencies.detectTool ?? detectFoundationTool

  const items = await Promise.all(
    pack.items.map(async (tool) => {
      const metadata = getFoundationToolMetadata(tool)
      const detected = await detectTool(tool)

      return {
        tool,
        executable: metadata.executable,
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
