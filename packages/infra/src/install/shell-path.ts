/**
 * @file src/install/shell-path.ts
 * @author michaeljou
 */

import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type SupportedShellName = 'zsh' | 'bash' | 'sh'

export type UnixShellPathResult = {
  shellName: SupportedShellName
  profilePath: string
  updated: boolean
}

export type WindowsPathCleanupResult = {
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
    const normalized = relativePath === '' ? '.' : relativePath.split(path.sep).join('/')
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
export async function ensureUnixShellPath(
  args: EnsureUnixShellPathArgs,
): Promise<UnixShellPathResult> {
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

  if (
    currentContent.includes(profileBlock) ||
    currentContent.includes(`export PATH="${pathExpression}:$PATH"`)
  ) {
    return {
      shellName: shellProfile.shellName,
      profilePath,
      updated: false,
    }
  }

  const nextContent =
    currentContent.trim().length === 0
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

/**
 * 从常见 Unix shell 启动文件中移除 FoxPilot 管理的 PATH 片段。
 *
 * 卸载时只删除由 FoxPilot 自己写入的 block，不碰用户手写的其他 PATH 配置，
 * 这样可以避免把无关命令的环境变量一起清掉。
 */
export async function removeUnixShellPath(args: { homeDir: string; binDir: string }): Promise<{
  updatedProfiles: string[]
}> {
  const pathExpression = buildPathExpression(args.homeDir, args.binDir)
  const profileBlock = buildProfileBlock(pathExpression)
  const standaloneLine = `export PATH="${pathExpression}:$PATH"`
  const profilePaths = ['.zshrc', '.bashrc', '.profile'].map((fileName) =>
    path.join(args.homeDir, fileName),
  )
  const updatedProfiles: string[] = []

  for (const profilePath of profilePaths) {
    let currentContent = ''

    try {
      currentContent = await readFile(profilePath, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        continue
      }

      throw error
    }

    let nextContent = currentContent

    if (nextContent.includes(profileBlock)) {
      nextContent = nextContent.replace(`${profileBlock}\n`, '')
      nextContent = nextContent.replace(profileBlock, '')
    }

    nextContent = nextContent
      .split('\n')
      .filter((line) => line.trim() !== standaloneLine.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd()

    if (nextContent === currentContent.trimEnd()) {
      continue
    }

    await writeFile(profilePath, nextContent.length > 0 ? `${nextContent}\n` : '')
    updatedProfiles.push(profilePath)
  }

  return {
    updatedProfiles,
  }
}

function buildWindowsPathRemovalScript(targetPath: string): string {
  const escapedTargetPath = targetPath.replace(/'/g, "''")

  return [
    `$targetPath = '${escapedTargetPath}'`,
    'function Normalize-PathValue([string]$value) {',
    "  if ([string]::IsNullOrWhiteSpace($value)) { return '' }",
    "  $trimmed = $value.Trim().Trim('\"')",
    '  try {',
    "    return [System.IO.Path]::GetFullPath($trimmed).TrimEnd('\\\\')",
    '  } catch {',
    "    return $trimmed.TrimEnd('\\\\')",
    '  }',
    '}',
    "$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')",
    "if ([string]::IsNullOrWhiteSpace($currentPath)) { [Console]::Out.WriteLine('updated=false'); exit 0 }",
    '$normalizedTargetPath = Normalize-PathValue $targetPath',
    '$nextEntries = New-Object System.Collections.Generic.List[string]',
    '$updated = $false',
    "foreach ($entry in ($currentPath -split ';')) {",
    '  $normalizedEntry = Normalize-PathValue $entry',
    '  if ([string]::IsNullOrWhiteSpace($normalizedEntry)) { continue }',
    '  if ([string]::Compare($normalizedEntry, $normalizedTargetPath, $true) -eq 0) {',
    '    $updated = $true',
    '    continue',
    '  }',
    '  $nextEntries.Add($entry.Trim())',
    '}',
    "if ($updated) { [Environment]::SetEnvironmentVariable('Path', ($nextEntries -join ';'), 'User') }",
    '[Console]::Out.WriteLine(("updated={0}" -f $updated.ToString().ToLowerInvariant()))',
  ].join('\n')
}

/**
 * 从 Windows 当前用户级 Path 中移除 FoxPilot 对应的目录。
 *
 * Windows 的用户级环境变量不会像 shell rc 文件那样直接存在项目里，
 * 因此这里通过 PowerShell 读取并回写 `Path(User)`。
 * 只会删除完全匹配的那一项，不会改动其他 PATH 片段。
 */
export async function removeWindowsPathEntry(
  targetPath: string,
): Promise<WindowsPathCleanupResult> {
  const script = buildWindowsPathRemovalScript(targetPath)

  return new Promise((resolve, reject) => {
    const child = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', reject)
    child.on('close', (exitCode) => {
      if (exitCode !== 0) {
        reject(
          new Error(
            `[FoxPilot] Windows PATH 清理失败: ${stderr.trim() || stdout.trim() || `exitCode=${exitCode ?? 1}`}`,
          ),
        )
        return
      }

      resolve({
        updated: stdout.includes('updated=true'),
      })
    })
  })
}
