/**
 * @file src/install/install-paths.ts
 * @author michaeljou
 */

import path from 'node:path'

/**
 * 当前命令实例清单的固定文件名。
 */
export const INSTALL_MANIFEST_FILE_NAME = 'install-manifest.json'

/**
 * 用户级安装索引的固定文件名。
 */
export const INSTALL_INDEX_FILE_NAME = 'installations.json'

/**
 * 解析用户级安装索引文件路径。
 *
 * 这里显式区分 Windows 和类 Unix 平台，是为了让文档、测试和实现都使用同一套路径规则，
 * 避免继续把 `~/.foxpilot` 这种 Unix 写法混用到 Windows 设计里。
 */
export function resolveInstallIndexPath(
  homeDir: string,
  platform: NodeJS.Platform = process.platform,
): string {
  if (platform === 'win32') {
    return path.win32.join(homeDir, '.foxpilot', INSTALL_INDEX_FILE_NAME)
  }

  return path.posix.join(homeDir, '.foxpilot', INSTALL_INDEX_FILE_NAME)
}

/**
 * 根据当前命令入口路径推导实例清单路径。
 *
 * 第一版约定实例清单和命令入口放在同一目录，这样命令在运行时不需要跨目录猜测安装根目录。
 */
export function resolveInstallManifestPath(executablePath: string): string {
  return path.join(path.dirname(executablePath), INSTALL_MANIFEST_FILE_NAME)
}
