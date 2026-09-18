import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isNsfw } from '@/lib/nsfw'
import { usePrefs } from '@/stores/prefs'
import {
  loadAllGames,
  loadDeletedLog,
  loadCountHistory,
} from '@/lib/data/catalog'

export function useAllGames() {
  return useQuery({
    queryKey: ['db', 'all'],
    queryFn: loadAllGames,
  })
}

/**
 * The catalog as this visitor sees it: games marked 18+ are left out unless
 * they opted in (Settings). `hiddenNsfw` counts what was left out. The admin
 * app uses useAllGames() and always sees everything.
 */
export function useVisibleGames() {
  const all = useAllGames()
  const showNsfw = usePrefs((s) => s.showNsfw)
  const data = useMemo(() => {
    if (!all.data || showNsfw) return all.data
    return { ...all.data, games: all.data.games.filter((g) => !isNsfw(g)) }
  }, [all.data, showNsfw])
  const hiddenNsfw = all.data && data ? all.data.games.length - data.games.length : 0
  return { ...all, data, hiddenNsfw }
}

export function useDeletedGames() {
  return useQuery({
    queryKey: ['deleted'],
    queryFn: loadDeletedLog,
  })
}

export function useCountHistory() {
  return useQuery({
    queryKey: ['count-history'],
    queryFn: loadCountHistory,
  })
}
