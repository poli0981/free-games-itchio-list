import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TabSkeleton, type ChartTab } from '@/components/charts/chart-skeletons'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RouteError } from '@/components/route-error'
import { useVisibleGames, useCountHistory, useDeletedGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { lazyWithPreload, whenIdle } from '@/lib/lazy-preload'
import type { CountHistoryPoint, DeletedGameEntry, Game } from '@/types/game'

// Per-tab chunks (Recharts + the tab's charts). The first tab starts loading
// with this route; the others while the browser is idle, or as soon as a
// pointer or the keyboard reaches their tab.
const OverviewTab = lazyWithPreload(() => import('@/components/charts/tabs/overview-tab'))
const ReachTab = lazyWithPreload(() => import('@/components/charts/tabs/reach-tab'))
const QualityTab = lazyWithPreload(() => import('@/components/charts/tabs/quality-tab'))
const DiscoveryTab = lazyWithPreload(() => import('@/components/charts/tabs/discovery-tab'))
void OverviewTab.preload().catch(() => {}) // rendering retries (and reports) a failed download

const TABS: { id: ChartTab; preload: () => Promise<unknown> }[] = [
  { id: 'overview', preload: OverviewTab.preload },
  { id: 'reach', preload: ReachTab.preload },
  { id: 'quality', preload: QualityTab.preload },
  { id: 'discovery', preload: DiscoveryTab.preload },
]

const NO_GAMES: Game[] = []
const NO_DELETED: DeletedGameEntry[] = []
const NO_HISTORY: CountHistoryPoint[] = []

function Heading({ children }: { children?: ReactNode }) {
  const t = useT()
  return (
    <div className="mb-5 flex flex-col gap-1">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{t('titles.charts')}</h1>
      {children}
    </div>
  )
}

const PAGE = 'mx-auto max-w-[1440px] px-4 pt-6 pb-12 sm:px-8 md:pt-7'

// Phones: one full-width row of equal tabs. A wrapping row overflowed the
// fixed-height bar with the Vietnamese labels; the labels never shrink below
// their text, and on the narrowest screens the bar scrolls instead.
const TABS_LIST = 'max-md:flex max-md:h-11 max-md:w-full max-md:overflow-x-auto max-md:scrollbar-hide'
const TAB = 'max-md:h-full max-md:flex-1 max-md:px-1 max-md:text-[13px]'

// A tab shown once stays mounted: switching back must not rebuild its charts and
// replay their animations. Hidden, it keeps its width and its cards their height
// (a Recharts container measured at 0×0, as under display: none, unmounts its
// chart), but takes no room in the page and is out of reach (invisible, inert).
const PANEL =
  'mt-0 data-[state=inactive]:pointer-events-none data-[state=inactive]:invisible data-[state=inactive]:absolute data-[state=inactive]:inset-x-0 data-[state=inactive]:top-0 data-[state=inactive]:h-0 data-[state=inactive]:overflow-hidden'

export default function Charts() {
  const t = useT()
  const fmt = useFormat()
  useDocumentTitle(t('titles.charts'))
  const games = useVisibleGames()
  const deleted = useDeletedGames()
  const history = useCountHistory()
  const [tab, setTab] = useState<ChartTab>('overview')
  const [visited, setVisited] = useState<ReadonlySet<ChartTab>>(() => new Set(['overview']))

  const data = games.data?.games ?? NO_GAMES
  const deletedList = deleted.data ?? NO_DELETED
  const historyList = history.data ?? NO_HISTORY
  const hiddenNsfw = games.hiddenNsfw
  const ready = games.data !== undefined
  // The same elements as long as the data is the same, so switching tabs
  // re-renders the tab bar only, never the charts.
  const panels = useMemo<Record<ChartTab, ReactNode>>(
    () => ({
      overview: <OverviewTab games={data} deleted={deletedList} history={historyList} hiddenNsfw={hiddenNsfw} />,
      reach: <ReachTab games={data} deleted={deletedList} />,
      quality: <QualityTab games={data} deleted={deletedList} />,
      discovery: <DiscoveryTab games={data} />,
    }),
    [data, deletedList, historyList, hiddenNsfw],
  )

  useEffect(() => {
    if (!ready) return
    return whenIdle(() => {
      for (const { preload } of TABS) void preload().catch(() => {})
    })
  }, [ready])

  // A failed background refresh keeps the cached catalog on screen.
  if (games.isError && !games.data) {
    return <RouteError error={games.error} onRetry={() => void games.refetch()} />
  }

  const select = (value: string) => {
    const id = value as ChartTab
    setTab(id)
    setVisited((prev) => (prev.has(id) ? prev : new Set([...prev, id])))
  }

  return (
    <div className={PAGE}>
      <Heading>
        {ready && (
          <p className="font-mono text-xs text-muted-foreground">
            {hiddenNsfw > 0
              ? t('games.summary', {
                  shown: fmt.number(data.length),
                  total: fmt.number(data.length + hiddenNsfw),
                  date: fmt.date(games.data?.index.last_updated),
                })
              : t('games.summaryAll', { total: fmt.number(data.length), date: fmt.date(games.data?.index.last_updated) })}
          </p>
        )}
      </Heading>

      <Tabs value={tab} onValueChange={select}>
        <TabsList className={TABS_LIST}>
          {TABS.map(({ id, preload }) => (
            <TabsTrigger
              key={id}
              value={id}
              className={TAB}
              onPointerEnter={() => void preload().catch(() => {})}
              onFocus={() => void preload().catch(() => {})}
            >
              {t(`charts.tabs.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="relative mt-4">
          {TABS.map(({ id }) => (
            <TabsContent
              key={id}
              value={id}
              forceMount={visited.has(id) || undefined}
              inert={tab !== id}
              className={PANEL}
            >
              {ready ? <Suspense fallback={<TabSkeleton tab={id} />}>{panels[id]}</Suspense> : <TabSkeleton tab={id} />}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  )
}
