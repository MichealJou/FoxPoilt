/**
 * @file src/foundation/foundation-doctor.ts
 * @author michaeljou
 */

import {
  ensureFoundationPack,
  type EnsureFoundationPackDependencies,
  type FoundationInspectionResult,
} from '@foxpilot/integrations/foundation/foundation-installer.js'

/**
 * 当前第一批 doctor 先复用基础组合探测结果。
 *
 * 第二批开始再往这里补 repair、回滚和官方安装策略。
 */
export async function runFoundationDoctor(
  dependencies: Partial<EnsureFoundationPackDependencies> & {
    homeDir?: string
  } = {},
): Promise<FoundationInspectionResult> {
  return ensureFoundationPack(dependencies)
}
