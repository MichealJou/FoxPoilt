/**
 * @file src/install/shell-path.ts
 * @author michaeljou
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type SupportedShellName = 'zsh' | 'bash' | 'sh'

export type UnixShellPathResult = {
  shellName: SupportedShellName
  profilePath: string
  updated: boolean
}

type EnsureUnixShellPathArgs = {
  homeDir: string
  shellPath?: string
  binDir: string
}

function resolveShellProfile(shellPath: string | undefined): {
  shellName: SupportedShellName
  profileFileName: string
} {
  const shellName = path.basename(shellPath ?? '')

  if (shellName === 'zsh') {
    return {
      shellName: 'zsh',
      profileFileName: '.zshrc',
    }
  }

  if (shellName === 'bash') {
    return {
      shellName: 'bash',
      profileFileName: '.bashrc',
    }
  }

  return {
    shellName: 'sh',
    profileFileName: '.profile',
  }
}

function buildPathExpression(homeDir: string, binDir: string): string {
  const relativePath = path.relative(homeDir, binDir)

  if (!relativePath || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))) {
    const normalized = relativePath === '' ? '.': relativePath.split(path.sep).join('/')
    const homeRelative = normalized.startsWith('.') ? normalized : normalized

    if (homeRelative === '.') {
      return '$HOME'
    }

    return `$HOME/${homeRelative.replace(/^\.\//, '')}`
  }

  return binDir
}

function buildProfileBlock(pathExpression: string): string {
  return [
    '# >>> FoxPilot PATH >>>',
    `export PATH="${pathExpression}:$PATH"`,
    '# <<< FoxPilot PATH <<<',
  ].join('\n')
}

/**
 * 把 FoxPilot bin 目录写入 Unix shell 启动文件。
 *
 * 这个动作不会影响当前父 shell 进程，但会让后续打开的新终端自动带上
 * `~/.foxpilot/bin`。重复执行时必须保持幂等，不能一遍遍追加相同片段。
 */
export async function ensureUnixShellPath(args: EnsureUnixShellPathArgs): Promise<UnixShellPathResult> {
  const shellProfile = resolveShellProfile(args.shellPath)
  const profilePath = path.join(args.homeDir, shellProfile.profileFileName)
  const pathExpression = buildPathExpression(args.homeDir, args.binDir)
  const profileBlock = buildProfileBlock(pathExpression)

  let currentContent = ''

  try {
    currentContent = await readFile(profilePath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  if (currentContent.includes(profileBlock) || currentContent.includes(`export PATH="${pathExpression}:$PATH"`)) {
    return {
      shellName: shellProfile.shellName,
      profilePath,
      updated: false,
    }
  }

  const nextContent = currentContent.trim().length === 0
    ? `${profileBlock}\n`
    : `${currentContent.replace(/\s*$/, '\n\n')}${profileBlock}\n`

  await mkdir(path.dirname(profilePath), { recursive: true })
  await writeFile(profilePath, nextContent)

  return {
    shellName: shellProfile.shellName,
    profilePath,
    updated: true,
  }
}
