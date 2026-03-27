#!/usr/bin/env node

import { existsSync } from 'node:fs'

const runtimePostinstallUrl = new URL(
  '../dist/packages/infra/src/install/postinstall.js',
  import.meta.url,
)
const foundationInstallerUrl = new URL(
  '../dist/packages/integrations/src/foundation/foundation-installer.js',
  import.meta.url,
)

if (!existsSync(runtimePostinstallUrl) || !existsSync(foundationInstallerUrl)) {
  process.exit(0)
}

const { runPostinstall } = await import(runtimePostinstallUrl)
const { setupFoundationPack } = await import(foundationInstallerUrl)

try {
  await runPostinstall({
    setupFoundationPack,
  })
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[FoxPilot] postinstall 记录安装信息失败\n${detail}\n`)
  process.exitCode = 1
}
