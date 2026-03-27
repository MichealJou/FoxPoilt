export type DesktopRuntimeStatus = {
  shell: 'tauri' | 'web'
  runtime: 'shared-runtime-core'
  cliJsonReady: boolean
  pages: string[]
  platformAdapters: string[]
}

export function getFallbackDesktopRuntimeStatus(): DesktopRuntimeStatus {
  return {
    shell: 'web',
    runtime: 'shared-runtime-core',
    cliJsonReady: true,
    pages: ['dashboard', 'workspace', 'tasks', 'runs', 'events', 'control-plane', 'health'],
    platformAdapters: ['codex', 'claude_code', 'qoder', 'trae'],
  }
}
