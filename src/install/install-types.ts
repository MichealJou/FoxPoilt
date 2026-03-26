/**
 * @file src/install/install-types.ts
 * @author michaeljou
 */

/**
 * FoxPilot 当前支持的安装来源。
 *
 * 这里的值不是“用户偏好”，而是“当前这个命令实例实际由谁安装出来”。
 * `update` 命令会严格依赖这个字段进行分派。
 */
export type InstallMethod = 'npm' | 'brew' | 'release'

/**
 * 用于描述当前命令实例后续应该更新哪个目标。
 *
 * 不同安装来源使用的字段不同：
 * - npm 依赖 `npmPackage`
 * - brew 依赖 `brewTap` 与 `brewFormula`
 * - release 依赖 `releaseAsset`
 *
 * 这里允许字段可选，是因为单条实例只会用到其中一部分。
 */
export type InstallUpdateTarget = {
  npmPackage?: string
  brewTap?: string
  brewFormula?: string
  releaseAsset?: string
}

/**
 * 与当前可执行实例绑定的安装清单。
 *
 * 这份数据必须跟“当前正在执行的命令实例”放在一起，不能只存在用户级全局文件里。
 * 原因是同一台机器可能同时存在多种安装方式，而 `update` 需要以当前命令实例为准。
 */
export type InstallManifest = {
  schemaVersion: number
  installMethod: InstallMethod
  packageName: string
  packageVersion: string
  channel: string
  platform: NodeJS.Platform
  arch: NodeJS.Architecture
  installRoot: string
  binPath: string
  updateTarget: InstallUpdateTarget
  installedAt: string
  updatedAt: string
}

/**
 * 用户目录下安装索引中的单条记录。
 *
 * 这份数据不用于决定 update 应该怎么执行，它的主要职责是：
 * - 给 `install-info` 展示当前机器登记过哪些实例；
 * - 帮助诊断多实例共存或 PATH 冲突；
 * - 为迁移或清理旧安装提供基础信息。
 */
export type InstallIndexEntry = {
  installId: string
  installMethod: InstallMethod
  packageVersion: string
  platform: NodeJS.Platform
  arch: NodeJS.Architecture
  installRoot: string
  binPath: string
  lastSeenAt: string
}
