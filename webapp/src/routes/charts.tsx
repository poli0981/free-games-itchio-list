import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AvgSessionChart,
  DeletionReasonsChart,
  DeletionsOverTimeChart,
  GameCountChart,
  GenreChart,
  GenreTreemapChart,
  KpiCards,
  LanguagesChart,
  MadeWithChart,
  OnlineOfflineChart,
  PlatformChart,
  RatingChart,
  RecentDeletedChart,
  StatusChart,
  TopRatedCountChart,
  TopTagsChart,
} from '@/components/charts'
import { RouteError } from '@/components/route-error'
import { useAllGames, useCountHistory, useDeletedGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT } from '@/lib/i18n'

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
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
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
          <KpiCards games={data} deleted={deletedList} />
          <div className="grid gap-4 md:grid-cols-2">
            <GenreChart games={data} />
            <StatusChart games={data} />
            <OnlineOfflineChart games={data} />
            <MadeWithChart games={data} />
            <GameCountChart history={historyList} />
          </div>
        </TabsContent>

        <TabsContent value="reach">
          <div className="grid gap-4 md:grid-cols-2">
            <PlatformChart games={data} />
            <LanguagesChart games={data} />
            <AvgSessionChart games={data} />
            <RecentDeletedChart deleted={deletedList} />
          </div>
        </TabsContent>

        <TabsContent value="quality">
          <div className="grid gap-4 md:grid-cols-2">
            <RatingChart games={data} />
            <TopRatedCountChart games={data} />
            <DeletionsOverTimeChart deleted={deletedList} />
            <DeletionReasonsChart deleted={deletedList} />
          </div>
        </TabsContent>

        <TabsContent value="discovery">
          <div className="grid gap-4 md:grid-cols-2">
            <TopTagsChart games={data} />
            <GenreTreemapChart games={data} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
