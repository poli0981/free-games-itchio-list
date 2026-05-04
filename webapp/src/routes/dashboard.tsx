import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllGames, useDeletedGames } from '@/hooks/useGames'
import { computeOverview } from '@/lib/analytics'
import { formatNumber } from '@/lib/utils'

export default function Dashboard() {
  const games = useAllGames()
  const deleted = useDeletedGames()

  if (games.isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (games.isError) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-destructive">Failed to load games: {games.error.message}</p>
      </div>
    )
  }

  const stats = games.data ? computeOverview(games.data.games) : null
  const lastUpdated = games.data?.index.last_updated
    ? new Date(games.data.index.last_updated).toLocaleString()
    : '—'

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats ? formatNumber(stats.total) : '—'}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.releasedCount ?? 0} released
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NSFW Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats ? `${stats.nsfwPercent.toFixed(1)}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">{stats?.nsfwCount ?? 0} flagged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online (HTML5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats ? `${stats.onlinePercent.toFixed(1)}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">{stats?.htmlCount ?? 0} playable in browser</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Genre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.topGenre ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${formatNumber(stats.topGenreCount)} games` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Database Files</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {games.data?.index.files.map((f) => (
                <li key={f.name} className="flex justify-between border-b py-1 last:border-0">
                  <span className="font-mono text-muted-foreground">{f.name}</span>
                  <span>{formatNumber(f.count)} games</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deletion Log</CardTitle>
          </CardHeader>
          <CardContent>
            {deleted.isLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <p className="text-sm">
                <span className="text-3xl font-bold">{formatNumber(deleted.data?.length ?? 0)}</span>{' '}
                games removed total
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
