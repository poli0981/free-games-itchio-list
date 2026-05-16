import { useEffect } from 'react'
import { usePrefs } from '@/stores/prefs'

export function useDensityEffect() {
  const density = usePrefs((s) => s.density)
  useEffect(() => {
    document.documentElement.dataset.density = density
  }, [density])
}
