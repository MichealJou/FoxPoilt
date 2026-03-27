/**
 * @file src/foundation/foundation-official-installers.ts
 * @author michaeljou
 */

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import type { FoundationTool } from '@foxpilot/integrations/foundation/foundation-profile.js'

const execAsync = promisify(exec)

async function runUnixCommand(command: string, cwd?: string): Promise<void> {
  await execAsync(command, {
    cwd,
    shell: '/bin/sh',
  })
}

async function runWindowsCommand(command: string): Promise<void> {
  await execAsync(command, {
    shell: 'powershell.exe',
  })
}

export async function installFoundationTool(
  tool: FoundationTool,
  context: { homeDir: string; platform: NodeJS.Platform },
): Promise<void> {
  if (tool === 'beads') {
    if (context.platform === 'win32') {
      await runWindowsCommand(
        'irm https://raw.githubusercontent.com/steveyegge/beads/main/install.ps1 | iex',
      )
      return
    }

    await runUnixCommand(
      'curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash',
    )
    return
  }

  if (context.platform === 'win32') {
    const cloneOrPull = [
      `$repoPath = Join-Path "$env:USERPROFILE" ".codex\\superpowers"`,
      'if (Test-Path $repoPath) {',
      '  git -C $repoPath pull --ff-only',
      '} else {',
      '  git clone https://github.com/obra/superpowers.git $repoPath',
      '}',
      '$skillsDir = Join-Path "$env:USERPROFILE" ".agents\\skills"',
      'New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null',
      '$junctionPath = Join-Path $skillsDir "superpowers"',
      'if (Test-Path $junctionPath) { Remove-Item -Recurse -Force $junctionPath }',
      'cmd /c mklink /J "$junctionPath" "$repoPath\\skills"',
    ].join('; ')

    await runWindowsCommand(cloneOrPull)
    return
  }

  await runUnixCommand(
    [
      `REPO_PATH="${context.homeDir}/.codex/superpowers"`,
      'if [ -d "$REPO_PATH/.git" ]; then',
      '  git -C "$REPO_PATH" pull --ff-only',
      'else',
      '  mkdir -p "$(dirname "$REPO_PATH")"',
      '  git clone https://github.com/obra/superpowers.git "$REPO_PATH"',
      'fi',
      `mkdir -p "${context.homeDir}/.agents/skills"`,
      `ln -sfn "${context.homeDir}/.codex/superpowers/skills" "${context.homeDir}/.agents/skills/superpowers"`,
    ].join('\n'),
  )
}
