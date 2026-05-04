import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useGameBySlug } from '@/hooks/useGameBySlug'
import type { Game } from '@/types/game'

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function ArrayBadges({ items, variant = 'outline' }: { items: string[]; variant?: 'outline' | 'secondary' }) {
  if (!items || items.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((it) => (
        <Badge key={it} variant={variant}>
          {it}
        </Badge>
      ))}
    </div>
  )
}

function GameDetailView({ game }: { game: Game }) {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/games">
            <ArrowLeft className="h-4 w-4" />
            Back to games
          </Link>
        </Button>
        <Button size="sm" disabled title="Edit form coming in Phase 2">
          <Pencil className="h-4 w-4" />
          Edit (Phase 2)
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row">
          {game.thumbnail ? (
            <img
              src={game.thumbnail}
              alt=""
              className="h-48 w-full flex-shrink-0 rounded-lg object-cover md:w-80"
            />
          ) : (
            <div className="h-48 w-full flex-shrink-0 rounded-lg bg-muted md:w-80" />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{game.name}</h1>
              {game.nsfw === 'Yes' && <Badge variant="destructive">NSFW</Badge>}
              <Badge variant={game.status === 'Released' ? 'default' : 'secondary'}>
                {game.status || 'Unknown'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">by {game.dev}</p>
            <p className="mt-3 text-sm">{game.description}</p>
            <div className="mt-auto pt-4">
              <Button variant="outline" size="sm" asChild>
                <a href={game.url} target="_blank" rel="noreferrer">
                  Open on itch.io
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <FieldRow label="Genre">
                <Badge variant="secondary">{game.genre || 'Unknown'}</Badge>
              </FieldRow>
              <FieldRow label="Publisher">{game.publisher || '—'}</FieldRow>
              <FieldRow label="Release date">{game.release_date || '—'}</FieldRow>
              <FieldRow label="Rating">
                {game.rating ? (
                  <span>
                    {game.rating}{' '}
                    <span className="text-muted-foreground">
                      {game.rating_count ? `(${game.rating_count} reviews)` : ''}
                    </span>
                  </span>
                ) : (
                  '—'
                )}
              </FieldRow>
              <FieldRow label="Avg session">{game.average_session || '—'}</FieldRow>
              <FieldRow label="NSFW">{game.nsfw || '—'}</FieldRow>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tech & Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <FieldRow label="Platforms">
                <ArrayBadges items={game.platforms} />
              </FieldRow>
              <FieldRow label="Languages">
                <ArrayBadges items={game.languages} />
              </FieldRow>
              <FieldRow label="Inputs">
                <ArrayBadges items={game.inputs} />
              </FieldRow>
              <FieldRow label="Made with">
                <ArrayBadges items={game.made_with} />
              </FieldRow>
              <FieldRow label="Tags">
                <ArrayBadges items={game.tags} variant="secondary" />
              </FieldRow>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Manual Annotations</CardTitle>
          <p className="text-xs text-muted-foreground">
            These three fields are user-editable in Phase 2 (safe_virus, notes, nsfw). Everything
            above comes from the scraper and is read-only.
          </p>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <FieldRow label="Safe / virus">
              <Badge variant="outline">{game.safe_virus || '?'}</Badge>
            </FieldRow>
            <FieldRow label="NSFW (override)">{game.nsfw || '—'}</FieldRow>
            <FieldRow label="Notes">
              {game.notes ? (
                <span className="whitespace-pre-wrap">{game.notes}</span>
              ) : (
                <span className="text-muted-foreground">No notes yet</span>
              )}
            </FieldRow>
          </dl>
        </CardContent>
      </Card>

      <Separator className="my-6" />
      <p className="text-xs text-muted-foreground">
        URL: <a href={game.url} target="_blank" rel="noreferrer" className="hover:underline">{game.url}</a>
      </p>
    </div>
  )
}

export default function GameDetail() {
  const { slug } = useParams()
  const decoded = slug ? decodeURIComponent(slug) : undefined
  const { game, isLoading, isError, error } = useGameBySlug(decoded)

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-destructive">Failed to load: {error?.message}</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/games">
            <ArrowLeft className="h-4 w-4" />
            Back to games
          </Link>
        </Button>
        <p className="text-muted-foreground">Game not found for slug: <code>{decoded}</code></p>
      </div>
    )
  }

  return <GameDetailView game={game} />
}
