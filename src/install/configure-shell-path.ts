/**
 * @file src/install/configure-shell-path.ts
 * @author michaeljou
 */

import os from 'node:os'

import { ensureUnixShellPath } from '@/install/shell-path.js'

type ConfigureShellPathArgs = {
  binDir?: string
  shellPath?: string
}

function parseArgs(argv: string[]): ConfigureShellPathArgs {
  const result: ConfigureShellPathArgs = {}

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]

    if (value === '--bin-dir') {
      result.binDir = argv[index + 1]
      index += 1
      continue
    }

    if (value === '--shell-path') {
      result.shellPath = argv[index + 1]
      index += 1
    }
  }

  return result
}

/**
 * 为 release 安装脚本提供一个稳定的 PATH 配置入口。
 *
 * shell 脚本只负责下载、解压和创建可执行链接；具体写入哪个启动文件、
 * 如何保证幂等，由这里统一处理，避免把配置逻辑散落在多个 shell 方言里。
 */
export async function runConfigureShellPath(argv: string[]): Promise<void> {
  const args = parseArgs(argv)

  if (!args.binDir) {
    throw new Error('Missing required --bin-dir')
  }

  const result = await ensureUnixShellPath({
    homeDir: os.homedir(),
    shellPath: args.shellPath ?? process.env.SHELL,
    binDir: args.binDir,
  })

  process.stdout.write('[FoxPilot] PATH 配置完成\n')
  process.stdout.write(`- shell: ${result.shellName}\n`)
  process.stdout.write(`- profilePath: ${result.profilePath}\n`)
  process.stdout.write(`- updated: ${result.updated ? 'true' : 'false'}\n`)
}

try {
  await runConfigureShellPath(process.argv.slice(2))
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[FoxPilot] PATH 配置失败\n${detail}\n`)
  process.exitCode = 1
}
