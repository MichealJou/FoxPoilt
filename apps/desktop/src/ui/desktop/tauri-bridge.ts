import type { DesktopRuntimeStatus } from '@desktop/ui/desktop/tauri-status.js'
import { getFallbackDesktopRuntimeStatus } from '@desktop/ui/desktop/tauri-status.js'

type TauriRuntimeStatusPayload = {
  shell: 'tauri'
  runtime: 'shared-runtime-core'
  cli_json_ready: boolean
  pages: string[]
  platform_adapters: string[]
}

function hasTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const tauriWindow = window as Window & {
    __TAURI__?: unknown
    __TAURI_INTERNALS__?: unknown
  }

  return Boolean(tauriWindow.__TAURI__ || tauriWindow.__TAURI_INTERNALS__)
}

export async function readDesktopRuntimeStatus(): Promise<DesktopRuntimeStatus> {
  if (!hasTauriRuntime()) {
    return getFallbackDesktopRuntimeStatus()
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const payload = await invoke<TauriRuntimeStatusPayload>('desktop_runtime_status')

    return {
      shell: payload.shell,
      runtime: payload.runtime,
      cliJsonReady: payload.cli_json_ready,
      pages: payload.pages,
      platformAdapters: payload.platform_adapters,
    }
  } catch {
    return getFallbackDesktopRuntimeStatus()
  }
}
