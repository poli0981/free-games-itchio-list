import type { Game } from '@/types/game'

export interface CountEntry {
  key: string
  count: number
}

export function countBy(games: Game[], key: 'genre' | 'status' | 'average_session'): CountEntry[] {
  const m = new Map<string, number>()
  for (const g of games) {
    const v = (g[key] || 'Unknown').toString().trim() || 'Unknown'
    m.set(v, (m.get(v) ?? 0) + 1)
  }
  return Array.from(m, ([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count)
}

export function countByArray(
  games: Game[],
  key: 'tags' | 'platforms' | 'languages' | 'inputs' | 'made_with',
): CountEntry[] {
  const m = new Map<string, number>()
  for (const g of games) {
    const arr = g[key]
    if (!Array.isArray(arr)) continue
    for (const v of arr) {
      if (!v) continue
      m.set(v, (m.get(v) ?? 0) + 1)
    }
  }
  return Array.from(m, ([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count)
}

export function topN(entries: CountEntry[], n: number): CountEntry[] {
  return entries.slice(0, n)
}

export interface OverviewStats {
  total: number
  nsfwCount: number
  nsfwPercent: number
  htmlCount: number
  onlinePercent: number
  releasedCount: number
  topGenre: string
  topGenreCount: number
}

export function computeOverview(games: Game[]): OverviewStats {
  const total = games.length
  const nsfwCount = games.filter((g) => g.nsfw === 'Yes').length
  const htmlCount = games.filter((g) => g.platforms?.includes('HTML5')).length
  const releasedCount = games.filter((g) => g.status === 'Released').length
  const genres = countBy(games, 'genre')
  const top = genres[0] ?? { key: 'N/A', count: 0 }
  return {
    total,
    nsfwCount,
    nsfwPercent: total ? (nsfwCount / total) * 100 : 0,
    htmlCount,
    onlinePercent: total ? (htmlCount / total) * 100 : 0,
    releasedCount,
    topGenre: top.key,
    topGenreCount: top.count,
  }
}

export function parseRating(rating: string): number | null {
  const n = parseFloat(rating)
  return isFinite(n) ? n : null
}

export function ratingHistogram(games: Game[], bins = 10): CountEntry[] {
  const out = Array.from({ length: bins }, (_, i) => ({
    key: `${(i * (5 / bins)).toFixed(1)}–${((i + 1) * (5 / bins)).toFixed(1)}`,
    count: 0,
  }))
  for (const g of games) {
    const r = parseRating(g.rating)
    if (r === null) continue
    const idx = Math.min(bins - 1, Math.floor((r / 5) * bins))
    out[idx].count += 1
  }
  return out
}
