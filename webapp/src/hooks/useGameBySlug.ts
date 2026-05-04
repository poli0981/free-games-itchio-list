import { useMemo } from 'react'
import { useAllGames } from './useGames'
import { slugify } from '@/lib/utils'
import type { Game } from '@/types/game'

export function useGameBySlug(slug: string | undefined) {
  const all = useAllGames()
  const game = useMemo<Game | undefined>(() => {
    if (!slug || !all.data) return undefined
    return all.data.games.find((g) => slugify(g.url) === slug)
  }, [slug, all.data])
  return { ...all, game }
}
