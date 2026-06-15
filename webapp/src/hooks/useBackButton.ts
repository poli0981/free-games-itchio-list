import { useEffect } from 'react'
import { isTauri } from '@/lib/runtime'

/**
 * Wire the Android hardware / gesture back button to in-app history.
 *
 * On Android (Tauri >= 2.9) the back button fires a `back-button` event. As
 * soon as we register a handler, the framework's built-in default (goBack, or
 * exit at the root) is suppressed — so we own both behaviours: navigate back
 * through the HashRouter history when the webview has somewhere to go, and let
 * the app close at the root entry.
 *
 * We drive the decision off the event payload's `canGoBack` rather than the
 * default goBack, because the default has been reported to exit hash-routed
 * SPAs even mid-history (tauri-apps/tauri#14406).
 *
 * No-op on the web build and on desktop: the event only ever fires on Android,
 * and `onBackButtonPress` reaches into Tauri internals, so it must be gated
 * behind `isTauri()` (it would throw in a plain browser).
 */
export function useBackButton(): void {
  useEffect(() => {
    if (!isTauri()) return
    let cancelled = false
    let unregister: (() => void) | undefined

    void (async () => {
      const { onBackButtonPress } = await import('@tauri-apps/api/app')
      const listener = await onBackButtonPress(({ canGoBack }) => {
        if (canGoBack) {
          // HashRouter listens to popstate, so this updates the route.
          window.history.back()
        } else {
          // At the first history entry — close the window so Android exits.
          void import('@tauri-apps/api/window').then(({ getCurrentWindow }) =>
            getCurrentWindow().close(),
          )
        }
      })
      if (cancelled) void listener.unregister()
      else unregister = () => void listener.unregister()
    })()

    return () => {
      cancelled = true
      unregister?.()
    }
  }, [])
}
