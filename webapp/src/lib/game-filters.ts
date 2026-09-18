/**
 * The Games page query: search, filters, sort and page, kept in the URL so
 * results can be shared and survive reloads. Pure functions (unit-tested).
 */
import type { Game } from '@/types/game'

export type SortKey = 'rated' | 'rating' | 'recent' | 'name'
export const SORT_KEYS: readonly SortKey[] = ['rated', 'rating', 'recent', 'name']

/** Multi-select filters: URL parameter → game field. */
export const LIST_FILTERS = {
  genre: 'genre',
  platform: 'platforms',
  status: 'status',
  tag: 'tags',
  lang: 'languages',
  input: 'inputs',
  engine: 'made_with',
} as const satisfies Record<string, keyof Game>

export type ListFilter = keyof typeof LIST_FILTERS

export interface GameQuery {
  q: string
  lists: Record<ListFilter, string[]>
  /** Minimum rating (e.g. 4.5), or null for any. */
  minRating: number | null
  /** Only games that run in the browser (HTML5 build). */
  browser: boolean
  sort: SortKey
  /** 1-based. */
  page: number
}

export const PAGE_SIZE = 100
export const RATING_STEPS = [4.5, 4, 3.5, 3] as const

const NA = 'N/A'

export function emptyQuery(): GameQuery {
  return {
    q: '',
    lists: { genre: [], platform: [], status: [], tag: [], lang: [], input: [], engine: [] },
    minRating: null,
    browser: false,
    sort: 'rated',
    page: 1,
  }
}

export function parseQuery(params: URLSearchParams): GameQuery {
  const query = emptyQuery()
  query.q = params.get('q')?.trim() ?? ''
  for (const key of Object.keys(LIST_FILTERS) as ListFilter[]) {
    query.lists[key] = [...new Set(params.getAll(key).filter(Boolean))]
  }
  const rating = Number(params.get('rating'))
  query.minRating = RATING_STEPS.includes(rating as (typeof RATING_STEPS)[number]) ? rating : null
  query.browser = params.get('browser') === '1'
  const sort = params.get('sort') as SortKey | null
  query.sort = sort && SORT_KEYS.includes(sort) ? sort : 'rated'
  const page = Math.floor(Number(params.get('page')))
  query.page = Number.isFinite(page) && page > 1 ? page : 1
  return query
}

/** URL parameters for `query`, leaving out defaults so links stay short. */
export function toParams(query: GameQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  for (const key of Object.keys(LIST_FILTERS) as ListFilter[]) {
    for (const value of query.lists[key]) params.append(key, value)
  }
  if (query.minRating !== null) params.set('rating', String(query.minRating))
  if (query.browser) params.set('browser', '1')
  if (query.sort !== 'rated') params.set('sort', query.sort)
  if (query.page > 1) params.set('page', String(query.page))
  return params
}

/** Case- and accent-insensitive text for matching. */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function values(game: Game, field: (typeof LIST_FILTERS)[ListFilter]): string[] {
  const value = game[field]
  if (Array.isArray(value)) return value
  return typeof value === 'string' && value && value !== NA ? [value] : []
}

export function ratingOf(game: Game): number | null {
  const n = Number.parseFloat(game.rating)
  return Number.isFinite(n) ? n : null
}

export function ratingCountOf(game: Game): number {
  const n = Number.parseInt(String(game.rating_count).replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

export function playsInBrowser(game: Game): boolean {
  return game.platforms?.includes('HTML5') ?? false
}

// Folded search text per game object; catalog objects are immutable once loaded.
const haystacks = new WeakMap<Game, string>()

function haystackOf(game: Game): string {
  let text = haystacks.get(game)
  if (text === undefined) {
    text = fold([game.name, game.dev, game.description, ...(game.tags ?? [])].join(' '))
    haystacks.set(game, text)
  }
  return text
}

/** Games matching every active filter except `skip` (used for facet counts). */
export function filterGames(games: Game[], query: GameQuery, skip?: ListFilter): Game[] {
  const needle = fold(query.q)
  return games.filter((game) => {
    if (needle && !haystackOf(game).includes(needle)) return false
    for (const key of Object.keys(LIST_FILTERS) as ListFilter[]) {
      if (key === skip) continue
      const wanted = query.lists[key]
      if (wanted.length === 0) continue
      const have = values(game, LIST_FILTERS[key])
      // Genre, status: any of the chosen values. Platforms, tags, languages,
      // inputs, engines: any of them too (a game rarely has all).
      if (!wanted.some((v) => have.includes(v))) return false
    }
    if (query.minRating !== null && (ratingOf(game) ?? -1) < query.minRating) return false
    if (query.browser && !playsInBrowser(game)) return false
    return true
  })
}

/**
 * `games` in the chosen order. The catalog appends new games at the end, so
 * "recent" is reverse catalog order unless a game carries `added_at`.
 */
export function sortGames(games: Game[], sort: SortKey): Game[] {
  const indexed = games.map((game, index) => ({ game, index }))
  // '"Voices…"' and '[Demo] …' sort by their first letter, not the punctuation.
  const sortName = (game: Game) => game.name.replace(/^[^\p{L}\p{N}]+/u, '')
  const byName = (a: Game, b: Game) => sortName(a).localeCompare(sortName(b), undefined, { sensitivity: 'base' })
  indexed.sort((a, b) => {
    switch (sort) {
      case 'name':
        return byName(a.game, b.game)
      case 'rating':
        return (
          (ratingOf(b.game) ?? -1) - (ratingOf(a.game) ?? -1) ||
          ratingCountOf(b.game) - ratingCountOf(a.game) ||
          byName(a.game, b.game)
        )
      case 'recent': {
        const at = (b.game.added_at ?? '').localeCompare(a.game.added_at ?? '')
        return at || b.index - a.index
      }
      default:
        return ratingCountOf(b.game) - ratingCountOf(a.game) || byName(a.game, b.game)
    }
  })
  return indexed.map((x) => x.game)
}

/** Value → number of games, most common first (for a filter's options). */
export function facetCounts(games: Game[], key: ListFilter): { value: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const game of games) {
    for (const value of values(game, LIST_FILTERS[key])) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}
