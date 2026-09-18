import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowUpRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExtLink } from '@/components/ext-link'
import { ErrorPage } from '@/components/error-page'
import { RouteError } from '@/components/route-error'
import { GameThumb } from '@/components/game-thumb'
import type { BackState } from '@/components/games/game-rows'
import { useGameBySlug } from '@/hooks/useGameBySlug'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { APP } from '@/lib/about'
import { useFormat } from '@/lib/format'
import { playsInBrowser, ratingCountOf, ratingOf } from '@/lib/game-filters'
import { useT, type MessageKey } from '@/lib/i18n'
import { isNsfw, requestNsfw } from '@/lib/nsfw'
import { orderPlatforms, platformLabel } from '@/lib/platforms'
import { usePrefs } from '@/stores/prefs'
import type { Game } from '@/types/game'

const NA = 'N/A'

const SAFETY: Record<string, MessageKey> = {
  Yes: 'detail.safety.yes',
  No: 'detail.safety.no',
  Caution: 'detail.safety.caution',
}

function text(value: string | undefined): string {
  return value && value !== NA ? value : ''
}

function list(values: string[] | undefined): string {
  return (values ?? []).filter((v) => v && v !== NA).join(', ')
}

/** Link to the removal / correction issue form with this game filled in. */
function reportUrl(game: Game): string {
  return `${APP.repo}/issues/new?template=remove_game.yml&games=${encodeURIComponent(game.url)}`
}

/** Clipboard API first; the old execCommand path for webviews that lack or refuse it. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      area.remove()
    }
  }
}

function CopyLink({ url }: { url: string }) {
  const t = useT()
  const [result, setResult] = useState<'copied' | 'failed' | null>(null)
  useEffect(() => {
    if (!result) return
    const timer = window.setTimeout(() => setResult(null), 2500)
    return () => window.clearTimeout(timer)
  }, [result])
  return (
    <button
      type="button"
      onClick={() => void copyText(url).then((ok) => setResult(ok ? 'copied' : 'failed'))}
      className="flex h-[42px] items-center gap-2 rounded-[9px] border bg-card px-4 text-[15px] hover:bg-accent"
    >
      {result === 'copied' && <Check className="size-4" aria-hidden="true" />}
      <span aria-live="polite">
        {result === 'copied' ? t('detail.copied') : result === 'failed' ? t('detail.copyFailed') : t('detail.copyLink')}
      </span>
    </button>
  )
}

function GameDetailView({ game }: { game: Game }) {
  const t = useT()
  const fmt = useFormat()
  useDocumentTitle(game.name)
  const location = useLocation()
  const navigate = useNavigate()
  // Came from the list: going back returns to the same entry (scroll position,
  // Android back button); a direct visit opens the list.
  const fromList = (location.state as BackState | null)?.back

  const rating = ratingOf(game)
  const count = ratingCountOf(game)
  const genre = text(game.genre)
  const status = text(game.status)
  const description = text(game.description)
  const tags = (game.tags ?? []).filter((tag) => tag && tag !== NA)
  const safety = SAFETY[game.safe_virus]

  const facts: { label: string; value: ReactNode }[] = [
    {
      label: t('detail.rating'),
      value:
        rating === null
          ? ''
          : count > 0
            ? t(count === 1 ? 'detail.ratingValue.one' : 'detail.ratingValue', {
                rating: fmt.rating(rating),
                count: fmt.number(count),
              })
            : `★ ${fmt.rating(rating)}`,
    },
    { label: t('detail.platforms'), value: orderPlatforms(game.platforms).map(platformLabel).join(', ') },
    { label: t('detail.avgSession'), value: text(game.average_session) },
    { label: t('detail.languages'), value: list(game.languages) },
    { label: t('detail.inputs'), value: list(game.inputs) },
    { label: t('detail.madeWith'), value: list(game.made_with) },
    { label: t('detail.genre'), value: genre },
    { label: t('detail.status'), value: status },
    { label: t('detail.publisher'), value: text(game.publisher) },
    { label: t('detail.releaseDate'), value: text(game.release_date) },
    { label: t('detail.updated'), value: text(game.updated_at) },
    { label: t('detail.added'), value: fmt.date(game.added_at) },
    { label: t('detail.safety'), value: safety ? t(safety) : '' },
  ].filter((f) => f.value)

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 pt-5 pb-12 sm:px-8 md:pt-7">
      <nav aria-label={t('detail.breadcrumb')} className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
        <Link
          to={fromList ?? '/games'}
          onClick={(e) => {
            if (!fromList || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
            e.preventDefault()
            navigate(-1)
          }}
          className="flex shrink-0 items-center gap-1.5 hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 md:hidden" aria-hidden="true" />
          {t('nav.games')}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="truncate text-foreground">
          {game.name}
        </span>
      </nav>

      <section className="grid items-start gap-8 md:grid-cols-[minmax(0,520px)_minmax(0,1fr)] md:gap-10">
        <GameThumb
          src={game.thumbnail}
          size={640}
          alt={t('detail.coverAlt', { name: game.name })}
          width={630}
          height={500}
          decoding="async"
          fetchPriority="high"
          className="aspect-[630/500] h-auto w-full rounded-[14px] border bg-thumb object-cover"
        />
        <div className="flex min-w-0 flex-col gap-[18px]">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance md:text-[40px] md:leading-[1.05]">
              {game.name}
            </h1>
            <p className="text-[15px] text-muted-foreground">{t('detail.byDev', { dev: game.dev })}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[13px]">
            {genre && <span className="rounded-full bg-brand-soft px-2.5 py-1">{genre}</span>}
            {status && <span className="rounded-full border px-2.5 py-1 text-muted-foreground">{status}</span>}
            {playsInBrowser(game) && (
              <span className="rounded-full border px-2.5 py-1 text-muted-foreground">{t('games.filter.browser')}</span>
            )}
            {isNsfw(game) && (
              <span className="rounded-full border border-destructive/40 px-2.5 py-1 text-destructive">18+</span>
            )}
          </div>
          {description && <p className="text-base leading-relaxed wrap-break-word">{description}</p>}
          <div className="flex flex-wrap gap-2.5">
            <ExtLink
              href={game.url}
              className="flex h-[42px] items-center gap-2 rounded-[9px] bg-primary px-[18px] text-[15px] font-medium text-primary-foreground hover:opacity-90"
            >
              {t('detail.openOnItch')}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </ExtLink>
            <CopyLink url={game.url} />
          </div>
          {game.notes && (
            <aside className="rounded-xl border border-l-4 border-l-primary bg-card px-4 py-3 text-sm">
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t('detail.note')}</p>
              <p className="whitespace-pre-wrap">{game.notes}</p>
            </aside>
          )}
          {facts.length > 0 && (
            <dl className="mt-2 grid grid-cols-[minmax(0,140px)_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-xl border bg-card px-5 py-[18px] text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
              {facts.map((f) => (
                <Fragment key={f.label}>
                  <dt className="text-muted-foreground">{f.label}</dt>
                  <dd className="wrap-break-word">{f.value}</dd>
                </Fragment>
              ))}
            </dl>
          )}
        </div>
      </section>

      {tags.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold tracking-[0.05em] text-muted-foreground uppercase">{t('detail.tags')}</h2>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  to={`/games?tag=${encodeURIComponent(tag)}`}
                  className="block rounded-full bg-muted px-[11px] py-[5px] text-[13px] hover:bg-accent hover:text-foreground"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[13px] text-muted-foreground">
        {t('detail.source')}{' '}
        <ExtLink href={reportUrl(game)} className="underline underline-offset-4 hover:text-foreground">
          {t('detail.report')}
        </ExtLink>
      </p>
    </div>
  )
}

export default function GameDetail() {
  const t = useT()
  const { slug } = useParams()
  const decoded = slug ? decodeURIComponent(slug) : undefined
  const { game, data, isLoading, isError, error, refetch } = useGameBySlug(decoded)

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1120px] flex-col gap-7 px-4 pt-7 sm:px-8">
        <Skeleton className="h-4 w-40" />
        <div className="grid gap-10 md:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
          <Skeleton className="aspect-[630/500] rounded-[14px]" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError && !data) {
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
              <ArrowLeft className="size-4" />
              {t('detail.backToGames')}
            </Link>
          </Button>
        }
      />
    )
  }

  return <NsfwGate game={game} />
}

/** An 18+ game stays behind this notice until the visitor opts in. */
function NsfwGate({ game }: { game: Game }) {
  const t = useT()
  const showNsfw = usePrefs((s) => s.showNsfw)
  if (!isNsfw(game) || showNsfw) return <GameDetailView game={game} />
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-12 pb-16 sm:px-8">
      <span className="self-start rounded-full border border-destructive/40 px-2.5 py-1 font-mono text-xs text-destructive">
        18+
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">{t('nsfw.gate.title')}</h1>
      <p className="text-muted-foreground">{t('nsfw.gate.desc')}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={requestNsfw}>{t('nsfw.gate.show')}</Button>
        <Button variant="outline" asChild>
          <Link to="/games">{t('detail.backToGames')}</Link>
        </Button>
      </div>
    </div>
  )
}
