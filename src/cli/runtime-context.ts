/**
 * @file src/cli/runtime-context.ts
 * @author michaeljou
 */

import type { InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * 注入到每个 CLI 命令中的共享运行时上下文。
 *
 * 这个对象的设计目标是把“运行环境信息”和“业务参数”分开：
 * - 业务参数来自命令行解析结果；
 * - 运行环境来自进程、测试桩或外部调用方。
 *
 * 这样命令处理器就能做到：
 * 1. 相同输入在不同环境下保持行为一致；
 * 2. 测试可以显式控制 cwd、stdin、homeDir；
 * 3. 不需要让每个命令自行读取 `process` 全局对象。
 */
export type CliRuntimeContext = {
  /** 当前执行的二进制名称，用于帮助输出和别名感知行为。 */
  binName: 'foxpilot' | 'fp'
  /** 用于解析相对用户输入的进程工作目录。 */
  cwd: string
  /** 用于解析全局配置和 SQLite 路径的主目录。 */
  homeDir: string
  /** 供交互式命令测试和脚本执行使用的 stdin 缓冲答案。 */
  stdin: string[]
  /** 在命令分发前解析出的当前有效交互语言。 */
  interfaceLanguage: InterfaceLanguage
  /** 测试和故障注入场景使用的可选依赖覆盖项。 */
  dependencies?: Record<string, unknown>
}
