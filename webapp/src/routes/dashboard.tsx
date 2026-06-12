import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RouteError } from '@/components/route-error'
import { useAllGames, useDeletedGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT } from '@/lib/i18n'
import { computeOverview } from '@/lib/analytics'
import { formatNumber } from '@/lib/utils'

export default function Dashboard() {
  const t = useT()
  useDocumentTitle(t('titles.dashboard'))
  const games = useAllGames()
  const deleted = useDeletedGames()

  if (games.isLoading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">{t('nav.dashboard')}</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (games.isError) {
    return <RouteError error={games.error} onRetry={() => void games.refetch()} />
  }

  const stats = games.data ? computeOverview(games.data.games) : null
  const lastUpdated = games.data?.index.last_updated
    ? new Date(games.data.index.last_updated).toLocaleString()
    : '—'

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('nav.dashboard')}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard.lastUpdated', { date: lastUpdated })}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalGames')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats ? formatNumber(stats.total) : '—'}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.released', { count: stats?.releasedCount ?? 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.nsfwRatio')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats ? `${stats.nsfwPercent.toFixed(1)}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">{t('dashboard.flagged', { count: stats?.nsfwCount ?? 0 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.onlineHtml5')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats ? `${stats.onlinePercent.toFixed(1)}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">{t('dashboard.playableInBrowser', { count: stats?.htmlCount ?? 0 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.topGenre')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.topGenre ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? t('dashboard.gamesCount', { count: formatNumber(stats.topGenreCount) }) : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.databaseFiles')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {games.data?.index.files.map((f) => (
                <li key={f.name} className="flex justify-between border-b py-1 last:border-0">
                  <span className="font-mono text-muted-foreground">{f.name}</span>
                  <span>{t('dashboard.gamesCount', { count: formatNumber(f.count) })}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.deletionLog')}</CardTitle>
          </CardHeader>
          <CardContent>
            {deleted.isLoading ? (
              <Skeleton className="h-20" />
            ) : (
              <p className="text-sm">
                <span className="text-3xl font-bold">{formatNumber(deleted.data?.length ?? 0)}</span>{' '}
                {t('dashboard.removedTotal')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
