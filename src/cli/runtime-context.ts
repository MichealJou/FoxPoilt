/**
 * @file src/cli/runtime-context.ts
 * @author michaeljou
 */

import type { InterfaceLanguage } from '@/i18n/interface-language.js'

/**
 * Shared runtime context injected into every CLI command.
 */
export type CliRuntimeContext = {
  /** Executed binary name, used for help text and alias-aware behavior. */
  binName: 'foxpilot' | 'fp'
  /** Process working directory used to resolve relative user input. */
  cwd: string
  /** Home directory used to resolve global config and SQLite paths. */
  homeDir: string
  /** Buffered stdin answers for interactive command tests and scripted runs. */
  stdin: string[]
  /** Effective UI language resolved before command dispatch. */
  interfaceLanguage: InterfaceLanguage
  /** Optional dependency overrides used by tests and failure injection. */
  dependencies?: Record<string, unknown>
}
