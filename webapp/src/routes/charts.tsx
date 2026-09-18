import { lazy, Suspense, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RouteError } from '@/components/route-error'
import { useVisibleGames, useCountHistory, useDeletedGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'

// Per-tab lazy chunks: Recharts + each tab's charts download only when the tab
// is first activated (Radix unmounts inactive TabsContent, so the import is not
// triggered until then).
const OverviewTab = lazy(() => import('@/components/charts/tabs/overview-tab'))
const ReachTab = lazy(() => import('@/components/charts/tabs/reach-tab'))
const QualityTab = lazy(() => import('@/components/charts/tabs/quality-tab'))
const DiscoveryTab = lazy(() => import('@/components/charts/tabs/discovery-tab'))

function ChartGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-72" />
      ))}
    </div>
  )
}

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

export default function Charts() {
  const t = useT()
  const fmt = useFormat()
  useDocumentTitle(t('titles.charts'))
  const games = useVisibleGames()
  const deleted = useDeletedGames()
  const history = useCountHistory()

  if (games.isLoading) {
    return (
      <div className={PAGE}>
        <Heading />
        <ChartGridSkeleton count={6} />
      </div>
    )
  }

  // A failed background refresh keeps the cached catalog on screen.
  if (games.isError && !games.data) {
    return <RouteError error={games.error} onRetry={() => void games.refetch()} />
  }

  const data = games.data?.games ?? []
  const deletedList = deleted.data ?? []
  const historyList = history.data ?? []

  return (
    <div className={PAGE}>
      <Heading>
        <p className="font-mono text-xs text-muted-foreground">
          {games.hiddenNsfw > 0
            ? t('games.summary', {
                shown: fmt.number(data.length),
                total: fmt.number(data.length + games.hiddenNsfw),
                date: fmt.date(games.data?.index.last_updated),
              })
            : t('games.summaryAll', { total: fmt.number(data.length), date: fmt.date(games.data?.index.last_updated) })}
        </p>
      </Heading>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t('charts.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="reach">{t('charts.tabs.reach')}</TabsTrigger>
          <TabsTrigger value="quality">{t('charts.tabs.quality')}</TabsTrigger>
          <TabsTrigger value="discovery">{t('charts.tabs.discovery')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<ChartGridSkeleton count={6} />}>
            <OverviewTab games={data} deleted={deletedList} history={historyList} hiddenNsfw={games.hiddenNsfw} />
          </Suspense>
        </TabsContent>

        <TabsContent value="reach">
          <Suspense fallback={<ChartGridSkeleton count={4} />}>
            <ReachTab games={data} deleted={deletedList} />
          </Suspense>
        </TabsContent>

        <TabsContent value="quality">
          <Suspense fallback={<ChartGridSkeleton count={4} />}>
            <QualityTab games={data} deleted={deletedList} />
          </Suspense>
        </TabsContent>

        <TabsContent value="discovery">
          <Suspense fallback={<ChartGridSkeleton count={2} />}>
            <DiscoveryTab games={data} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
