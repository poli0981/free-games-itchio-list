import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDeletedGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatNumber } from '@/lib/utils'

export default function Deleted() {
  useDocumentTitle('Deleted Games')
  const deleted = useDeletedGames()

  if (deleted.isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Deleted Games</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  if (deleted.isError) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Deleted Games</h1>
        <p className="text-destructive">Failed to load: {deleted.error.message}</p>
      </div>
    )
  }

  const entries = deleted.data ?? []
  const sorted = [...entries].sort((a, b) =>
    (b.deleted_at ?? '').localeCompare(a.deleted_at ?? ''),
  )

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Deleted Games</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(sorted.length)} entries
        </p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground">No deletions logged.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((d) => (
            <Card key={`${d.url}-${d.deleted_at}`}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-semibold hover:underline"
                    >
                      {d.name}
                    </a>
                    <span className="truncate text-xs text-muted-foreground">{d.url}</span>
                  </div>
                  <p className="text-sm">
                    <Badge variant="outline">{d.reason}</Badge>
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.deleted_at ? new Date(d.deleted_at).toLocaleString() : ''}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
