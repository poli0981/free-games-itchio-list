interface TauriInternals {
  __TAURI_INTERNALS__?: unknown
}

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false
  return '__TAURI_INTERNALS__' in (window as unknown as TauriInternals)
}
