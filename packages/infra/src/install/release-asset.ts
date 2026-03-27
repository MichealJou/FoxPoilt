/**
 * @file src/install/release-asset.ts
 * @author michaeljou
 */

/**
 * 根据平台与架构生成 release 资产文件名。
 *
 * 第一版约定：
 * - macOS / Linux 使用 `.tar.gz`
 * - Windows 使用 `.zip`
 */
export function buildReleaseAssetName(input: {
  platform: NodeJS.Platform
  arch: NodeJS.Architecture
}): string {
  const extension = input.platform === 'win32' ? 'zip' : 'tar.gz'
  return `foxpilot-${input.platform}-${input.arch}.${extension}`
}

/**
 * 根据仓库、版本和资产名生成 GitHub Release 下载地址。
 *
 * 第一版约定：
 * - `latest` 使用 GitHub 的 latest download 地址
 * - 其他版本统一使用 `v<version>` tag
 */
export function buildReleaseDownloadUrl(input: {
  repository: string
  version: string
  assetName: string
}): string {
  if (input.version === 'latest') {
    return `https://github.com/${input.repository}/releases/latest/download/${input.assetName}`
  }

  return `https://github.com/${input.repository}/releases/download/v${input.version}/${input.assetName}`
}
