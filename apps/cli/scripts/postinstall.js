#!/usr/bin/env node

import { existsSync } from 'node:fs'

const runtimePostinstallUrl = new URL('../dist/install/postinstall.js', import.meta.url)

if (!existsSync(runtimePostinstallUrl)) {
  process.exit(0)
}

await import(runtimePostinstallUrl)
