interface TauriInternals {
  __TAURI_INTERNALS__?: unknown
}

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false
  return '__TAURI_INTERNALS__' in (window as unknown as TauriInternals)
}

export interface RuntimeInfo {
  platform: string
  version: string
}

export async function getRuntimeInfo(): Promise<RuntimeInfo | null> {
  if (!isTauri()) return null
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<RuntimeInfo>('runtime_info')
}
