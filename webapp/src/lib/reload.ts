const RELOAD_KEY = 'reloaded-after-deploy'

/**
 * Reload the page, at most once per 30 s: if the reload doesn't fix things the
 * page shows its error instead of looping. Without sessionStorage there is no
 * loop guard, so no automatic reload either. Returns whether it reloaded.
 */
export function guardedReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
    if (Date.now() - last < 30_000) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
