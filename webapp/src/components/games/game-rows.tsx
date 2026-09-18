import { Link } from 'react-router'
import { GameThumb } from '@/components/game-thumb'
import { useFormat } from '@/lib/format'
import { ratingCountOf, ratingOf, type SortKey } from '@/lib/game-filters'
import { useT } from '@/lib/i18n'
import { isNsfw } from '@/lib/nsfw'
import { orderPlatforms, platformShort } from '@/lib/platforms'
import { slugify } from '@/lib/utils'
import type { Game } from '@/types/game'

const NA = 'N/A'
const COLUMNS = 'grid grid-cols-[minmax(0,44fr)_minmax(0,14fr)_minmax(0,18fr)_minmax(0,10fr)_minmax(0,14fr)] gap-4'

/** Router state the detail page reads to link back to this exact list. */
export interface BackState {
  back?: string
}

function text(value: string | undefined): string {
  return value && value !== NA ? value : ''
}

function AdultBadge() {
  return (
    <span className="shrink-0 rounded border border-destructive/40 px-1 font-mono text-[10px] leading-4 text-destructive">
      18+
    </span>
  )
}

function Rating({ game, withCount }: { game: Game; withCount?: boolean }) {
  const t = useT()
  const fmt = useFormat()
  const rating = ratingOf(game)
  if (rating === null) {
    return (
      <span className="text-muted-foreground" title={t('games.noRating')}>
        —
      </span>
    )
  }
  const count = ratingCountOf(game)
  return (
    <span className="font-mono text-[13px] whitespace-nowrap">
      <span aria-hidden="true">★ </span>
      {fmt.rating(rating)}
      {withCount && count > 0 && (
        <span
          className="text-muted-foreground"
          title={t(count === 1 ? 'games.ratingCount.one' : 'games.ratingCount', { count: fmt.number(count) })}
        >
          {' '}
          ({fmt.number(count)})
        </span>
      )}
    </span>
  )
}

/** Desktop list: an ARIA table whose rows open the game (the name link covers the row). */
export function GamesTable({ games, sort, back }: { games: Game[]; sort: SortKey; back: string }) {
  const t = useT()
  return (
    <div role="table" aria-label={t('games.table')} className="overflow-hidden rounded-xl border bg-card">
      <div role="rowgroup">
        <div
          role="row"
          className={`${COLUMNS} h-10 items-center border-b px-4 text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase`}
        >
          <span role="columnheader" aria-sort={sort === 'name' ? 'ascending' : undefined}>
            {t('games.col.game')}
          </span>
          <span role="columnheader">{t('games.filter.genre')}</span>
          <span role="columnheader">{t('games.col.platforms')}</span>
          <span role="columnheader" aria-sort={sort === 'rating' ? 'descending' : undefined}>
            {t('games.filter.rating')}
          </span>
          <span role="columnheader">{t('games.filter.status')}</span>
        </div>
      </div>
      <div role="rowgroup">
        {games.map((game) => (
          <div
            key={game.url}
            role="row"
            data-row
            className={`${COLUMNS} relative min-h-14 items-center border-b px-4 py-2 last:border-b-0 focus-within:bg-accent/60 hover:bg-accent/60`}
          >
            <span role="cell" className="flex min-w-0 items-center gap-3">
              <GameThumb
                src={game.thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-9 w-12 shrink-0 rounded-md bg-thumb object-cover"
              />
              <span className="flex min-w-0 flex-col">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Link
                    to={`/games/${slugify(game.url)}`}
                    state={{ back } satisfies BackState}
                    className="truncate text-sm font-medium after:absolute after:inset-0"
                  >
                    {game.name}
                  </Link>
                  {isNsfw(game) && <AdultBadge />}
                </span>
                <span className="truncate text-[13px] text-muted-foreground">{game.dev}</span>
              </span>
            </span>
            <span role="cell" className="truncate text-[13px] text-muted-foreground">
              {text(game.genre) || '—'}
            </span>
            <span role="cell" className="truncate text-[13px] text-muted-foreground">
              {orderPlatforms(game.platforms).map(platformShort).join(' · ') || '—'}
            </span>
            <span role="cell">
              <Rating game={game} withCount />
            </span>
            <span role="cell" className="truncate text-[13px] text-muted-foreground">
              {text(game.status) || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Phone list: one tappable row per game. */
export function GamesList({ games, back }: { games: Game[]; back: string }) {
  return (
    <ul className="flex flex-col">
      {games.map((game) => {
        const meta = [text(game.genre), orderPlatforms(game.platforms).map(platformShort).join(', ')]
          .filter(Boolean)
          .join(' · ')
        return (
          <li key={game.url} className="border-b">
            <Link
              to={`/games/${slugify(game.url)}`}
              state={{ back } satisfies BackState}
              data-row
              className="flex min-h-[72px] items-center gap-3 py-2.5"
            >
              <GameThumb
                src={game.thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-12 w-16 shrink-0 rounded-lg bg-thumb object-cover"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[15px] font-medium">{game.name}</span>
                  {isNsfw(game) && <AdultBadge />}
                </span>
                <span className="truncate text-[13px] text-muted-foreground">{meta || game.dev}</span>
              </span>
              <Rating game={game} />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
