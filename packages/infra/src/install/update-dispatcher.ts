/**
 * @file src/install/update-dispatcher.ts
 * @author michaeljou
 */

import type { InstallManifest } from '@foxpilot/infra/install/install-types.js'

/**
 * update 分派器依赖集合。
 *
 * 这层只负责“根据当前实例来源选择哪条更新策略”，不直接负责如何执行 shell 命令。
 * 这样可以先稳定验证来源分派，再逐步把真实更新器接进来。
 */
export type UpdateDispatcherDependencies<T = string> = {
  runNpmUpdate: (manifest: InstallManifest) => Promise<T>
  runBrewUpdate: (manifest: InstallManifest) => Promise<T>
  runReleaseUpdate: (manifest: InstallManifest) => Promise<T>
}

/**
 * 根据当前实例来源分派 update 策略。
 */
export async function dispatchUpdate<T>(
  manifest: InstallManifest,
  dependencies: UpdateDispatcherDependencies<T>,
): Promise<T> {
  if (manifest.installMethod === 'npm') {
    return dependencies.runNpmUpdate(manifest)
  }

  if (manifest.installMethod === 'brew') {
    return dependencies.runBrewUpdate(manifest)
  }

  return dependencies.runReleaseUpdate(manifest)
}
