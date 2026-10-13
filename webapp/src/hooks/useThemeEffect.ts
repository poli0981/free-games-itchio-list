import { useEffect } from 'react'
import { resolveTheme, useThemeStore, type Theme } from '@/stores/theme'

// index.html's theme-color pair (the browser's address bar / title bar colour).
const THEME_COLOR = { light: '#fafaf9', dark: '#0b0b0c' } as const

/** Under `system` each meta keeps its own scheme's colour; a chosen theme sets both to it. */
function applyThemeColor(theme: Theme, resolved: 'light' | 'dark') {
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const own = meta.media.includes('dark') ? 'dark' : 'light'
    meta.content = THEME_COLOR[theme === 'system' ? own : resolved]
  }
}

/** Puts the theme on <html> (`.dark`); index.html's inline script did so already before the first paint. */
export function useThemeEffect() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement

    function apply() {
      const resolved = resolveTheme(theme)
      root.classList.toggle('dark', resolved === 'dark')
      applyThemeColor(theme, resolved)
    }

    apply()

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => apply()
      mql.addEventListener('change', listener)
      return () => mql.removeEventListener('change', listener)
    }
  }, [theme])
}
