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
import { useAllGames, useCountHistory, useDeletedGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function Charts() {
  useDocumentTitle('Charts')
  const games = useAllGames()
  const deleted = useDeletedGames()
  const history = useCountHistory()

  if (games.isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Charts</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    )
  }

  if (games.isError) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-4 text-3xl font-bold tracking-tight">Charts</h1>
        <p className="text-destructive">Failed to load: {games.error.message}</p>
      </div>
    )
  }

  const data = games.data?.games ?? []
  const deletedList = deleted.data ?? []
  const historyList = history.data ?? []

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-4 text-3xl font-bold tracking-tight">Charts</h1>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reach">Reach</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
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
