interface TauriInternals {
  __TAURI_INTERNALS__?: unknown
}

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false
  return '__TAURI_INTERNALS__' in (window as unknown as TauriInternals)
}

/** The Android app (the only mobile build); by platform, not by window width. */
export function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}
