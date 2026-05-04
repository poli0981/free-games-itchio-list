import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllGames } from '@/hooks/useGames'
import { slugify, formatNumber } from '@/lib/utils'

const PAGE_SIZE = 100

export default function Games() {
  const games = useAllGames()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<string>('')

  const filtered = useMemo(() => {
    if (!games.data) return []
    const q = query.trim().toLowerCase()
    return games.data.games.filter((g) => {
      if (genre && g.genre !== genre) return false
      if (!q) return true
      return (
        g.name.toLowerCase().includes(q) ||
        g.dev.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
      )
    })
  }, [games.data, query, genre])

  const genres = useMemo(() => {
    if (!games.data) return []
    const s = new Set<string>()
    for (const g of games.data.games) s.add(g.genre || 'Unknown')
    return Array.from(s).sort()
  }, [games.data])

  if (games.isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  if (games.isError) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Games</h1>
        <p className="text-destructive">Failed to load: {games.error.message}</p>
      </div>
    )
  }

  const visible = filtered.slice(0, PAGE_SIZE)

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(filtered.length)} of {formatNumber(games.data?.games.length ?? 0)}
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, dev, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {visible.map((g) => (
          <Link key={g.url} to={`/games/${encodeURIComponent(slugify(g.url))}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex items-start gap-4 p-4">
                {g.thumbnail ? (
                  <img
                    src={g.thumbnail}
                    alt=""
                    loading="lazy"
                    className="h-16 w-28 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-16 w-28 flex-shrink-0 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="truncate font-semibold">{g.name}</h3>
                    <span className="text-xs text-muted-foreground">by {g.dev}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{g.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary">{g.genre}</Badge>
                    {g.platforms?.slice(0, 4).map((p) => (
                      <Badge key={p} variant="outline">
                        {p}
                      </Badge>
                    ))}
                    {g.nsfw === 'Yes' && <Badge variant="destructive">NSFW</Badge>}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right text-sm">
                  <div className="font-semibold">{g.rating || '—'}</div>
                  <div className="text-xs text-muted-foreground">
                    {g.rating_count ? `${g.rating_count} reviews` : '—'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length > PAGE_SIZE && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Showing first {PAGE_SIZE} of {formatNumber(filtered.length)}. Virtualized full table comes
          in Phase 1b.
        </p>
      )}
    </div>
  )
}
