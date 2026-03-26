/**
 * @file src/install/uninstall-dispatcher.ts
 * @author michaeljou
 */

import type { InstallManifest } from '@/install/install-types.js'

/**
 * uninstall 分派器依赖集合。
 *
 * 它和 update 分派器一样，只负责根据安装来源选择卸载策略，
 * 不直接关心具体 shell 命令或文件删除细节。
 */
export type UninstallDispatcherDependencies<T = string> = {
  runNpmUninstall: (manifest: InstallManifest) => Promise<T>
  runBrewUninstall: (manifest: InstallManifest) => Promise<T>
  runReleaseUninstall: (manifest: InstallManifest) => Promise<T>
}

/**
 * 根据当前安装来源分派卸载策略。
 */
export async function dispatchUninstall<T>(
  manifest: InstallManifest,
  dependencies: UninstallDispatcherDependencies<T>,
): Promise<T> {
  if (manifest.installMethod === 'npm') {
    return dependencies.runNpmUninstall(manifest)
  }

  if (manifest.installMethod === 'brew') {
    return dependencies.runBrewUninstall(manifest)
  }

  return dependencies.runReleaseUninstall(manifest)
}
