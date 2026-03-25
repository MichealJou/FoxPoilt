export type CliRuntimeContext = {
  binName: 'foxpilot' | 'fp'
  cwd: string
  homeDir: string
  stdin: string[]
  dependencies?: Record<string, unknown>
}
