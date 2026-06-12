import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ExtLink } from '@/components/ext-link'
import { EditGameForm } from '@/components/edit-game-form'
import { ErrorPage } from '@/components/error-page'
import { RouteError } from '@/components/route-error'
import { GameThumb } from '@/components/game-thumb'
import { useGameBySlug } from '@/hooks/useGameBySlug'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuth } from '@/stores/auth'
import { useT } from '@/lib/i18n'
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
  const t = useT()
  useDocumentTitle(game.name)
  const pat = useAuth((s) => s.pat)
  const [editing, setEditing] = useState(false)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/games">
            <ArrowLeft className="h-4 w-4" />
            {t('detail.backToGames')}
          </Link>
        </Button>
        {!editing && (
          <Button
            size="sm"
            onClick={() => setEditing(true)}
            disabled={!pat}
            title={pat ? t('detail.editTooltip') : t('detail.editTooltipLocked')}
          >
            <Pencil className="h-4 w-4" />
            {t('common.edit')}
          </Button>
        )}
      </div>

      {editing && (
        <div className="mb-6">
          <EditGameForm
            game={game}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row">
          <GameThumb
            src={game.thumbnail}
            alt={t('detail.coverAlt', { name: game.name })}
            width={630}
            height={500}
            decoding="async"
            fetchPriority="high"
            className="h-48 w-full flex-shrink-0 rounded-lg object-cover md:w-80"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{game.name}</h1>
              {game.nsfw === 'Yes' && <Badge variant="destructive">NSFW</Badge>}
              <Badge variant={game.status === 'Released' ? 'default' : 'secondary'}>
                {game.status || t('common.unknown')}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{t('detail.byDev', { dev: game.dev })}</p>
            <p className="mt-3 text-sm">{game.description}</p>
            <div className="mt-auto pt-4">
              <Button variant="outline" size="sm" asChild>
                <ExtLink href={game.url}>
                  {t('detail.openOnItch')}
                  <ExternalLink className="h-4 w-4" />
                </ExtLink>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('detail.metadata')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <FieldRow label={t('detail.genre')}>
                <Badge variant="secondary">{game.genre || t('common.unknown')}</Badge>
              </FieldRow>
              <FieldRow label={t('detail.publisher')}>{game.publisher || '—'}</FieldRow>
              <FieldRow label={t('detail.releaseDate')}>{game.release_date || '—'}</FieldRow>
              <FieldRow label={t('detail.rating')}>
                {game.rating ? (
                  <span>
                    {game.rating}{' '}
                    <span className="text-muted-foreground">
                      {game.rating_count ? t('detail.reviewsCount', { count: game.rating_count }) : ''}
                    </span>
                  </span>
                ) : (
                  '—'
                )}
              </FieldRow>
              <FieldRow label={t('detail.avgSession')}>{game.average_session || '—'}</FieldRow>
              <FieldRow label="NSFW">{game.nsfw || '—'}</FieldRow>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('detail.techReach')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <FieldRow label={t('detail.platforms')}>
                <ArrayBadges items={game.platforms} />
              </FieldRow>
              <FieldRow label={t('detail.languages')}>
                <ArrayBadges items={game.languages} />
              </FieldRow>
              <FieldRow label={t('detail.inputs')}>
                <ArrayBadges items={game.inputs} />
              </FieldRow>
              <FieldRow label={t('detail.madeWith')}>
                <ArrayBadges items={game.made_with} />
              </FieldRow>
              <FieldRow label={t('detail.tags')}>
                <ArrayBadges items={game.tags} variant="secondary" />
              </FieldRow>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('detail.manualAnnotations')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('detail.annotationsDesc')}</p>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <FieldRow label={t('detail.safeVirus')}>
              <Badge variant="outline">{game.safe_virus || '?'}</Badge>
            </FieldRow>
            <FieldRow label={t('detail.nsfwOverride')}>{game.nsfw || '—'}</FieldRow>
            <FieldRow label={t('detail.notes')}>
              {game.notes ? (
                <span className="whitespace-pre-wrap">{game.notes}</span>
              ) : (
                <span className="text-muted-foreground">{t('detail.noNotes')}</span>
              )}
            </FieldRow>
          </dl>
        </CardContent>
      </Card>

      <Separator className="my-6" />
      <p className="text-xs text-muted-foreground">
        URL: <ExtLink href={game.url} className="hover:underline">{game.url}</ExtLink>
      </p>
    </div>
  )
}

export default function GameDetail() {
  const t = useT()
  const { slug } = useParams()
  const decoded = slug ? decodeURIComponent(slug) : undefined
  const { game, isLoading, isError, error, refetch } = useGameBySlug(decoded)

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
    return <RouteError error={error} onRetry={() => void refetch()} />
  }

  if (!game) {
    return (
      <ErrorPage
        status={404}
        title={t('error.gameNotFound.title')}
        description={t('error.gameNotFound.desc', { slug: decoded ?? '' })}
        actions={
          <Button asChild>
            <Link to="/games">
              <ArrowLeft className="h-4 w-4" />
              {t('detail.backToGames')}
            </Link>
          </Button>
        }
      />
    )
  }

  return <GameDetailView game={game} />
}
