/**
 * @file src/install/update-runner.ts
 * @author michaeljou
 */

import { spawn } from 'node:child_process'
import path from 'node:path'

import type { InstallManifest } from '@foxpilot/infra/install/install-types.js'

export type UpdateCommandResult = {
  exitCode: number
  stdout: string
  stderr: string
}

export type UpdateRunnerDependencies = {
  platform?: NodeJS.Platform
  runCommand?: (command: string, args: string[]) => Promise<UpdateCommandResult>
}

async function runCommand(command: string, args: string[]): Promise<UpdateCommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      })
    })
  })
}

function getRunner(dependencies: UpdateRunnerDependencies = {}) {
  return dependencies.runCommand ?? runCommand
}

/**
 * 执行 npm 渠道更新。
 */
export async function runNpmUpdate(
  manifest: InstallManifest,
  dependencies: UpdateRunnerDependencies = {},
): Promise<string> {
  const runner = getRunner(dependencies)
  const packageName = manifest.updateTarget.npmPackage ?? manifest.packageName
  const args = ['install', '-g', `${packageName}@latest`]
  const result = await runner('npm', args)

  return ['strategy: npm', `command: npm ${args.join(' ')}`, `exitCode: ${result.exitCode}`].join(
    '\n',
  )
}

/**
 * 执行 brew 渠道更新。
 */
export async function runBrewUpdate(
  manifest: InstallManifest,
  dependencies: UpdateRunnerDependencies = {},
): Promise<string> {
  const runner = getRunner(dependencies)
  const formula = manifest.updateTarget.brewFormula ?? manifest.packageName
  const args = ['upgrade', formula]
  const result = await runner('brew', args)

  return ['strategy: brew', `command: brew ${args.join(' ')}`, `exitCode: ${result.exitCode}`].join(
    '\n',
  )
}

/**
 * 执行 release 渠道更新。
 *
 * 第一版直接复用安装脚本：
 * - Unix 走 `scripts/install.sh`
 * - Windows 走 `scripts/install.ps1`
 */
export async function runReleaseUpdate(
  manifest: InstallManifest,
  dependencies: UpdateRunnerDependencies = {},
): Promise<string> {
  const runner = getRunner(dependencies)
  const platform = dependencies.platform ?? process.platform

  if (platform === 'win32') {
    const scriptPath = path.join(manifest.installRoot, 'scripts', 'install.ps1')
    const args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Version', 'latest']
    const result = await runner('powershell', args)

    return [
      'strategy: release',
      `command: powershell ${args.join(' ')}`,
      `exitCode: ${result.exitCode}`,
    ].join('\n')
  }

  const scriptPath = path.join(manifest.installRoot, 'scripts', 'install.sh')
  const args = [scriptPath, '--version', 'latest']
  const result = await runner('sh', args)

  return [
    'strategy: release',
    `command: sh ${args.join(' ')}`,
    `exitCode: ${result.exitCode}`,
  ].join('\n')
}
