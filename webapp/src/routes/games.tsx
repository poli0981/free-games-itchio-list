import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { Search, X } from 'lucide-react'
import {
  ActiveFilters,
  FilterMenu,
  NsfwChip,
  RatingMenu,
  ToggleChip,
  type ActivePill,
  type FilterOption,
} from '@/components/games/filter-chips'
import { GamesList, GamesTable } from '@/components/games/game-rows'
import { Pager } from '@/components/games/pager'
import { RouteError } from '@/components/route-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useVisibleGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFormat } from '@/lib/format'
import {
  emptyQuery,
  facetCounts,
  filterGames,
  LIST_FILTERS,
  PAGE_SIZE,
  parseQuery,
  SORT_KEYS,
  sortGames,
  toParams,
  type GameQuery,
  type ListFilter,
  type SortKey,
} from '@/lib/game-filters'
import { useT, type MessageKey } from '@/lib/i18n'
import { requestNsfw } from '@/lib/nsfw'
import { platformLabel } from '@/lib/platforms'
import { useIsMobile } from '@/lib/use-is-mobile'
import { usePrefs } from '@/stores/prefs'

const FILTER_LABEL: Record<ListFilter, MessageKey> = {
  genre: 'games.filter.genre',
  platform: 'games.filter.platform',
  status: 'games.filter.status',
  tag: 'games.filter.tag',
  lang: 'games.filter.lang',
  input: 'games.filter.input',
  engine: 'games.filter.engine',
}

const SORT_LABEL: Record<SortKey, MessageKey> = {
  rated: 'games.sort.rated',
  rating: 'games.sort.rating',
  recent: 'games.sort.recent',
  name: 'games.sort.name',
}

// Chip order: the common filters first, the long-tail ones after rating/browser.
const MAIN_FILTERS: ListFilter[] = ['genre', 'platform', 'status', 'tag']
const MORE_FILTERS: ListFilter[] = ['lang', 'input', 'engine']
const ALL_FILTERS = Object.keys(LIST_FILTERS) as ListFilter[]

const optionLabel = (key: ListFilter, value: string) => (key === 'platform' ? platformLabel(value) : value)

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex h-14 items-center gap-3 border-b px-4 last:border-b-0">
          <Skeleton className="h-9 w-12 rounded-md" />
          <Skeleton className="h-4 w-56" />
        </div>
      ))}
    </div>
  )
}

export default function Games() {
  const t = useT()
  const fmt = useFormat()
  useDocumentTitle(t('titles.games'))
  const games = useVisibleGames()
  const showNsfw = usePrefs((s) => s.showNsfw)
  const setShowNsfw = usePrefs((s) => s.setShowNsfw)
  const isMobile = useIsMobile()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => parseQuery(params), [params])

  /** Merge `patch` into the URL; any change but paging goes back to page 1. */
  const update = useCallback(
    (patch: Partial<GameQuery>, push = false) => {
      setParams((prev) => toParams({ ...parseQuery(prev), page: 1, ...patch }), { replace: !push })
    },
    [setParams],
  )

  // The search box is typed into freely and written to the URL after a pause.
  // When the URL changes from elsewhere (header search, back / forward) the box
  // follows; when our own write lands, what was typed since then is kept.
  const [text, setText] = useState(query.q)
  const [syncedQ, setSyncedQ] = useState(query.q)
  const [ownQ, setOwnQ] = useState<string | null>(null)
  if (query.q !== syncedQ) {
    setSyncedQ(query.q)
    if (query.q === ownQ) setOwnQ(null)
    else if (query.q !== text.trim()) setText(query.q)
  }
  useEffect(() => {
    const q = text.trim()
    if (q === query.q) return
    const href = window.location.href
    const timer = window.setTimeout(() => {
      // The visitor opened a game (or went elsewhere) meanwhile: don't pull them back.
      if (window.location.href !== href) return
      setOwnQ(q)
      update({ q })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [text, query.q, update])

  const all = games.data?.games
  const results = useMemo(() => (all ? sortGames(filterGames(all, query), query.sort) : []), [all, query])

  // Counts for a filter ignore that filter's own choices, so picking a second
  // genre still shows how many games it would add.
  const listRef = useRef<HTMLDivElement>(null)
  const focusList = useRef(false)
  useEffect(() => {
    if (!focusList.current) return
    focusList.current = false
    listRef.current?.focus({ preventScroll: true })
  }, [params])

  const optionGetters = useMemo(() => {
    const getter = (key: ListFilter) => (): FilterOption[] => {
      if (!all) return []
      const counts = facetCounts(filterGames(all, query, key), key)
      const listed = new Set(counts.map((c) => c.value))
      for (const value of query.lists[key]) if (!listed.has(value)) counts.push({ value, count: 0 })
      return counts.map((c) => ({ ...c, label: optionLabel(key, c.value) }))
    }
    return Object.fromEntries(ALL_FILTERS.map((key) => [key, getter(key)])) as Record<ListFilter, () => FilterOption[]>
  }, [all, query])

  // A failed background refresh (offline, deploy in flight) keeps the cached catalog on screen.
  if (games.isError && !games.data) return <RouteError error={games.error} onRetry={() => void games.refetch()} />

  const setList = (key: ListFilter, values: string[]) => update({ lists: { ...query.lists, [key]: values } })
  const pills: ActivePill[] = [
    ...ALL_FILTERS.flatMap((key) =>
      query.lists[key].map((value) => ({
        key: `${key}:${value}`,
        label: optionLabel(key, value),
        onRemove: () => setList(key, query.lists[key].filter((v) => v !== value)),
      })),
    ),
    ...(query.minRating !== null
      ? [{ key: 'rating', label: t('games.pill.rating', { n: fmt.rating(query.minRating) }), onRemove: () => update({ minRating: null }) }]
      : []),
    ...(query.browser ? [{ key: 'browser', label: t('games.filter.browser'), onRemove: () => update({ browser: false }) }] : []),
  ]
  const clearFilters = () => update({ lists: emptyQuery().lists, minRating: null, browser: false })
  const clearEverything = () => {
    setText('')
    setOwnQ('')
    update({ ...emptyQuery(), sort: query.sort })
  }

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(query.page, pages)
  const first = (page - 1) * PAGE_SIZE
  const rows = results.slice(first, first + PAGE_SIZE)
  // A new page is a history entry: App's ScrollManager starts it at the top (and
  // Back returns to where page 1 was scrolled); focus moves to the list.
  const goToPage = (next: number) => {
    focusList.current = true
    update({ page: next }, true)
  }
  const back = location.pathname + location.search

  // "440 of 2,681 games": the total is the whole catalog, 18+ games included.
  const total = (all?.length ?? 0) + games.hiddenNsfw
  const updated = fmt.date(games.data?.index.last_updated)
  const summary =
    results.length !== total
      ? t('games.summary', { shown: fmt.number(results.length), total: fmt.number(total), date: updated })
      : t('games.summaryAll', { total: fmt.number(total), date: updated })

  const filterMenu = (key: ListFilter) => (
    <FilterMenu
      key={key}
      label={t(FILTER_LABEL[key])}
      selected={query.lists[key]}
      onChange={(values) => setList(key, values)}
      getOptions={optionGetters[key]}
    />
  )
  const chips = (
    <>
      {MAIN_FILTERS.map(filterMenu)}
      <RatingMenu value={query.minRating} onChange={(minRating) => update({ minRating })} />
      <ToggleChip label={t('games.filter.browser')} pressed={query.browser} onChange={(browser) => update({ browser })} />
      {MORE_FILTERS.map(filterMenu)}
      {(games.hiddenNsfw > 0 || showNsfw) && (
        <NsfwChip shown={showNsfw} onShow={requestNsfw} onHide={() => setShowNsfw(false)} />
      )}
    </>
  )

  const search = (
    <label className="flex h-11 items-center gap-2 rounded-[10px] border bg-card px-3 text-muted-foreground focus-within:border-primary md:h-[34px] md:w-80 md:rounded-lg">
      <Search className="size-4 shrink-0 md:size-[15px]" aria-hidden="true" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('games.search.placeholder')}
        aria-label={t('header.search.label')}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-hidden placeholder:text-muted-foreground md:text-[13px] [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          aria-label={t('games.search.clear')}
          onClick={() => {
            setText('')
            setOwnQ('')
            update({ q: '' })
          }}
          className="-mr-1 flex size-8 items-center justify-center rounded-md hover:text-foreground md:size-6"
        >
          <X className="size-4 md:size-3.5" aria-hidden="true" />
        </button>
      )}
    </label>
  )

  const sortSelect = (
    <label className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
      <span className="max-md:sr-only">{t('games.sort.label')}</span>
      <select
        value={query.sort}
        onChange={(e) => update({ sort: e.target.value as SortKey })}
        className="h-9 rounded-lg border bg-card px-2 text-[13px] text-foreground md:h-8"
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {t(SORT_LABEL[key])}
          </option>
        ))}
      </select>
    </label>
  )

  let content
  if (games.isPending) {
    content = <ListSkeleton />
  } else if (results.length === 0) {
    content = (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
        <p className="text-base font-medium">{t('games.empty.title')}</p>
        <p className="text-sm text-muted-foreground">{t('games.empty.desc')}</p>
        <button type="button" onClick={clearEverything} className="mt-1 text-sm underline underline-offset-4">
          {t('games.clearAll')}
        </button>
      </div>
    )
  } else {
    content = (
      <>
        <div ref={listRef} tabIndex={-1} className="outline-hidden">
          {isMobile ? (
            <GamesList games={rows} back={back} />
          ) : (
            <GamesTable games={rows} sort={query.sort} back={back} />
          )}
        </div>
        <Pager
          start={first + 1}
          end={first + rows.length}
          total={results.length}
          page={page}
          pages={pages}
          onPage={goToPage}
        />
      </>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 pt-3 pb-10 md:px-8 md:pt-7">
      {isMobile ? (
        <>
          <h1 className="sr-only">{t('titles.games')}</h1>
          {search}
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">{chips}</div>
          <div className="flex items-center justify-between gap-3">
            <p role="status" className="font-mono text-xs text-muted-foreground">
              {t(results.length === 1 ? 'games.countShort.one' : 'games.countShort', {
                n: fmt.number(results.length),
              })}
              {!showNsfw && games.hiddenNsfw > 0 && ` · ${t('games.nsfw.hidden')}`}
            </p>
            {sortSelect}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{t('titles.games')}</h1>
              <p role="status" className="font-mono text-xs text-muted-foreground">
                {summary}
              </p>
            </div>
            {sortSelect}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {search}
            {chips}
          </div>
        </>
      )}
      <ActiveFilters pills={pills} onClearAll={clearFilters} />
      {content}
    </div>
  )
}
