import { useEffect } from 'react'
import { resolveTheme, useThemeStore } from '@/stores/theme'

export function useThemeEffect() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement

    function apply() {
      const resolved = resolveTheme(theme)
      root.classList.toggle('dark', resolved === 'dark')
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
