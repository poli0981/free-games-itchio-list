import type { Game, DeletedGameEntry } from '@/types/game'

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

function parseRating(rating: string): number | null {
  const n = parseFloat(rating)
  return isFinite(n) ? n : null
}

export function classifyOnline(games: Game[]): { online: number; offline: number } {
  let online = 0
  let offline = 0
  for (const g of games) {
    if (g.platforms?.includes('HTML5')) online++
    else offline++
  }
  return { online, offline }
}

export function topMadeWith(games: Game[], n = 8): CountEntry[] {
  const m = new Map<string, number>()
  for (const g of games) {
    const first = g.made_with?.[0]
    if (!first) {
      m.set('Unknown', (m.get('Unknown') ?? 0) + 1)
      continue
    }
    m.set(first, (m.get(first) ?? 0) + 1)
  }
  return Array.from(m, ([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
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

export interface TreemapNode {
  name: string
  size: number
}

export function genreTreemapData(games: Game[], topN = 12): TreemapNode[] {
  return countBy(games, 'genre')
    .slice(0, topN)
    .map((e) => ({ name: e.key, size: e.count }))
}

export interface KpiStats {
  totalGames: number
  onlineCount: number
  nsfwCount: number
  totalDeleted: number
  avgRating: number
}

export function computeKpis(games: Game[], deleted: DeletedGameEntry[]): KpiStats {
  const overview = computeOverview(games)
  let ratingSum = 0
  let ratingCount = 0
  for (const g of games) {
    const r = parseRating(g.rating)
    if (r !== null) {
      ratingSum += r
      ratingCount += 1
    }
  }
  return {
    totalGames: overview.total,
    onlineCount: overview.htmlCount,
    nsfwCount: overview.nsfwCount,
    totalDeleted: deleted.length,
    avgRating: ratingCount ? ratingSum / ratingCount : 0,
  }
}

export function deletionsByMonth(deleted: DeletedGameEntry[]): CountEntry[] {
  const m = new Map<string, number>()
  for (const d of deleted) {
    const month = (d.deleted_at ?? '').slice(0, 7)
    if (month.length !== 7) continue
    m.set(month, (m.get(month) ?? 0) + 1)
  }
  return Array.from(m, ([key, count]) => ({ key, count })).sort((a, b) => a.key.localeCompare(b.key))
}

export function deletionReasonCounts(deleted: DeletedGameEntry[]): CountEntry[] {
  let paid = 0
  let removed = 0
  let other = 0
  for (const d of deleted) {
    const reason = (d.reason ?? '').toLowerCase()
    if (reason.includes('paid')) {
      paid += 1
    } else if (reason.includes('no longer exists')) {
      removed += 1
    } else {
      other += 1
    }
  }
  const out: CountEntry[] = []
  if (paid) out.push({ key: 'Became paid', count: paid })
  if (removed) out.push({ key: 'Page removed', count: removed })
  if (other) out.push({ key: 'Other', count: other })
  return out
}

export function topByRatingCount(games: Game[], n = 10): CountEntry[] {
  return games
    .map((g) => ({ key: g.name, count: Number(g.rating_count) || 0 }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}
