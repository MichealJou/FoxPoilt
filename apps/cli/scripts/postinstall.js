#!/usr/bin/env node

import { existsSync } from 'node:fs'

const runtimePostinstallUrl = new URL('../dist/packages/infra/src/install/postinstall.js', import.meta.url)

if (!existsSync(runtimePostinstallUrl)) {
  process.exit(0)
}

const { runPostinstall } = await import(runtimePostinstallUrl)

try {
  await runPostinstall()
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[FoxPilot] postinstall 记录安装信息失败\n${detail}\n`)
  process.exitCode = 1
}
