import { useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { GameThumb } from '@/components/game-thumb'
import { RouteError } from '@/components/route-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllGames, useVisibleGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFormat } from '@/lib/format'
import { sortGames, ratingOf } from '@/lib/game-filters'
import { useT, type MessageKey } from '@/lib/i18n'
import { slugify } from '@/lib/utils'

const FEATURES: { mark: string; title: MessageKey; text: MessageKey }[] = [
  { mark: '01', title: 'welcome.feature.filter.title', text: 'welcome.feature.filter.text' },
  { mark: '02', title: 'welcome.feature.fresh.title', text: 'welcome.feature.fresh.text' },
  { mark: '03', title: 'welcome.feature.open.title', text: 'welcome.feature.open.text' },
]

export default function Welcome() {
  const t = useT()
  const fmt = useFormat()
  useDocumentTitle(t('titles.home'), { exact: true })
  const all = useAllGames()
  const visible = useVisibleGames()

  const recent = useMemo(() => (visible.data ? sortGames(visible.data.games, 'recent').slice(0, 5) : []), [visible.data])

  if (all.isError && !all.data) return <RouteError error={all.error} onRetry={() => void all.refetch()} />

  const total = all.data ? fmt.number(all.data.games.length) : null
  const updated = fmt.date(all.data?.index.last_updated)

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-14 px-4 pt-12 pb-12 sm:px-8 md:pt-[88px]">
      <section className="flex max-w-[760px] flex-col gap-[22px]">
        <p className="flex items-center gap-2 self-start rounded-full border px-2.5 py-1 font-mono text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          {total ? t('welcome.status', { date: updated, n: total }) : t('common.loading')}
        </p>
        <h1 className="text-[40px] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-[60px] sm:leading-[1.02]">
          {t('welcome.title')}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">{t('welcome.lead')}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <Link
            to="/games"
            className="flex h-[42px] items-center gap-2 rounded-[9px] bg-primary px-[18px] text-[15px] font-medium text-primary-foreground hover:opacity-90"
          >
            {total ? t('welcome.browse', { n: total }) : t('nav.games')}
            <ArrowRight className="size-[15px]" aria-hidden="true" />
          </Link>
          <Link
            to="/charts"
            className="flex h-[42px] items-center rounded-[9px] border bg-card px-4 text-[15px] font-medium hover:bg-accent"
          >
            {t('welcome.charts')}
          </Link>
          <Link to="/suggest" className="flex h-[42px] items-center rounded-[9px] px-3.5 text-[15px] text-muted-foreground hover:text-foreground">
            {t('nav.suggest')}
          </Link>
        </div>
      </section>

      <section aria-label={t('welcome.features')} className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.mark} className="flex flex-col gap-2.5 rounded-xl border bg-card p-[22px]" data-card-pad>
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted font-mono text-[13px] font-medium text-primary">
              {f.mark}
            </span>
            <h2 className="text-base font-semibold">{t(f.title)}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t(f.text)}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">{t('welcome.recent')}</h2>
          <Link to="/games?sort=recent" className="text-sm text-muted-foreground hover:text-foreground">
            {t('welcome.seeAll')} →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          {visible.isPending &&
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="m-3 h-9 rounded-md" />)}
          {recent.map((game) => {
            const rating = ratingOf(game)
            return (
              <Link
                key={game.url}
                to={`/games/${slugify(game.url)}`}
                className="flex min-h-[58px] items-center gap-3.5 border-b px-4 py-2 last:border-b-0 hover:bg-accent/60"
                data-row
              >
                <GameThumb src={game.thumbnail} alt="" loading="lazy" decoding="async" className="h-9 w-12 shrink-0 rounded-md bg-thumb object-cover" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{game.name}</span>
                  <span className="truncate text-[13px] text-muted-foreground">{game.dev}</span>
                </span>
                {game.genre && game.genre !== 'N/A' && (
                  <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground sm:inline">
                    {game.genre}
                  </span>
                )}
                <span className="w-16 text-right font-mono text-[13px]">{rating !== null ? `★ ${fmt.rating(rating)}` : '—'}</span>
                {game.added_at && (
                  <span className="hidden w-28 text-right font-mono text-xs text-muted-foreground md:inline">
                    {t('welcome.added', { date: fmt.date(game.added_at) })}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
