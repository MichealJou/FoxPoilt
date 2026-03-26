/**
 * @file src/install/uninstall-runner.ts
 * @author michaeljou
 */

import { rm, unlink } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

import type { InstallManifest } from '@/install/install-types.js'

export type UninstallCommandResult = {
  exitCode: number
  stdout: string
  stderr: string
}

export type UninstallRunnerDependencies = {
  platform?: NodeJS.Platform
  homeDir?: string
  runCommand?: (command: string, args: string[]) => Promise<UninstallCommandResult>
  removePath?: (targetPath: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>
}

async function runCommand(command: string, args: string[]): Promise<UninstallCommandResult> {
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

async function removePath(
  targetPath: string,
  options: { recursive?: boolean; force?: boolean } = {},
): Promise<void> {
  if (options.recursive) {
    await rm(targetPath, {
      recursive: true,
      force: options.force ?? true,
    })
    return
  }

  try {
    await unlink(targetPath)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

function getCommandRunner(dependencies: UninstallRunnerDependencies = {}) {
  return dependencies.runCommand ?? runCommand
}

function getPathRemover(dependencies: UninstallRunnerDependencies = {}) {
  return dependencies.removePath ?? removePath
}

/**
 * 执行 npm 渠道卸载。
 */
export async function runNpmUninstall(
  manifest: InstallManifest,
  dependencies: UninstallRunnerDependencies = {},
): Promise<string> {
  const runner = getCommandRunner(dependencies)
  const packageName = manifest.updateTarget.npmPackage ?? manifest.packageName
  const args = ['uninstall', '-g', packageName]
  const result = await runner('npm', args)

  return [
    'strategy: npm',
    `command: npm ${args.join(' ')}`,
    `exitCode: ${result.exitCode}`,
  ].join('\n')
}

/**
 * 执行 brew 渠道卸载。
 */
export async function runBrewUninstall(
  manifest: InstallManifest,
  dependencies: UninstallRunnerDependencies = {},
): Promise<string> {
  const runner = getCommandRunner(dependencies)
  const formula = manifest.updateTarget.brewFormula ?? manifest.packageName
  const args = ['uninstall', formula]
  const result = await runner('brew', args)

  return [
    'strategy: brew',
    `command: brew ${args.join(' ')}`,
    `exitCode: ${result.exitCode}`,
  ].join('\n')
}

/**
 * 执行 release 渠道卸载。
 *
 * 当前 release 安装默认把命令入口放在 `~/.foxpilot/bin`，
 * 因此这里会同时清掉：
 * - foxpilot / fp 命令入口；
 * - installRoot 对应的 release 安装目录。
 */
export async function runReleaseUninstall(
  manifest: InstallManifest,
  dependencies: UninstallRunnerDependencies = {},
): Promise<string> {
  const remover = getPathRemover(dependencies)
  const platform = dependencies.platform ?? process.platform
  const homeDir = dependencies.homeDir ?? process.env.HOME ?? ''

  const binDir = path.join(homeDir, '.foxpilot', 'bin')
  const commandPaths =
    platform === 'win32'
      ? [path.join(binDir, 'foxpilot.cmd'), path.join(binDir, 'fp.cmd')]
      : [path.join(binDir, 'foxpilot'), path.join(binDir, 'fp')]

  for (const commandPath of commandPaths) {
    await remover(commandPath)
  }

  await remover(manifest.installRoot, {
    recursive: true,
    force: true,
  })

  return [
    'strategy: release',
    ...commandPaths.map((targetPath) => `removed: ${targetPath}`),
    `removed: ${manifest.installRoot}`,
  ].join('\n')
}
