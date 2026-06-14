import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RouteError } from '@/components/route-error'
import { useAllGames, useCountHistory, useDeletedGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
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

export default function Charts() {
  const t = useT()
  useDocumentTitle(t('titles.charts'))
  const games = useAllGames()
  const deleted = useDeletedGames()
  const history = useCountHistory()

  if (games.isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('titles.charts')}</h1>
        <ChartGridSkeleton count={6} />
      </div>
    )
  }

  if (games.isError) {
    return <RouteError error={games.error} onRetry={() => void games.refetch()} />
  }

  const data = games.data?.games ?? []
  const deletedList = deleted.data ?? []
  const historyList = history.data ?? []

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">{t('titles.charts')}</h1>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t('charts.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="reach">{t('charts.tabs.reach')}</TabsTrigger>
          <TabsTrigger value="quality">{t('charts.tabs.quality')}</TabsTrigger>
          <TabsTrigger value="discovery">{t('charts.tabs.discovery')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Suspense fallback={<ChartGridSkeleton count={6} />}>
            <OverviewTab games={data} deleted={deletedList} history={historyList} />
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
