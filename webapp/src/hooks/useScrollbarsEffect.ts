import { useEffect } from 'react'
import { usePrefs } from '@/stores/prefs'

/** <html data-scrollbars="hidden"> while "Hide scrollbars" is on (index.css). */
export function useScrollbarsEffect() {
  const hide = usePrefs((s) => s.hideScrollbars)
  useEffect(() => {
    const root = document.documentElement
    if (hide) root.dataset.scrollbars = 'hidden'
    else delete root.dataset.scrollbars
  }, [hide])
}
