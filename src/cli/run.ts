#!/usr/bin/env node
/**
 * @file src/cli/run.ts
 * @author michaeljou
 */

import os from 'node:os'
import path from 'node:path'

import { main } from '@/cli/main.js'

/**
 * 根据当前真实可执行文件名推断这次调用使用的是完整命令还是简写命令。
 *
 * 这样做的目的不是影响业务行为，而是让 CLI 运行时上下文保留“用户实际怎么调用”的事实。
 * 后续如果帮助页、遥测或日志需要区分 `foxpilot` 与 `fp`，这里就是稳定入口。
 */
export function resolveBinName(executablePath: string): 'foxpilot' | 'fp' {
  const fileName = path.basename(executablePath)
  return fileName === 'fp' ? 'fp' : 'foxpilot'
}

/**
 * 真实进程入口。
 *
 * 与测试直接调用 `main(argv, context)` 不同，这里负责把 Node 进程环境映射成标准运行时上下文，
 * 再把命令处理结果输出到终端并回填退出码。
 */
export async function runFromProcess(argv: string[]): Promise<void> {
  const result = await main(argv, {
    binName: resolveBinName(process.argv[1] ?? 'foxpilot'),
    cwd: process.cwd(),
    homeDir: os.homedir(),
    stdin: [],
  })

  if (result.stdout) {
    process.stdout.write(`${result.stdout}\n`)
  }

  process.exitCode = result.exitCode
}

try {
  await runFromProcess(process.argv.slice(2))
} catch (error) {
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
  process.stderr.write(`[FoxPilot] 进程执行失败\n${detail}\n`)
  process.exitCode = 1
}
