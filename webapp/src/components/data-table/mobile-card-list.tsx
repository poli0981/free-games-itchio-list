import { Link } from 'react-router-dom'
import type { Row } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { GameThumb } from '@/components/game-thumb'
import type { Game } from '@/types/game'
import { slugify } from '@/lib/utils'
import { useT } from '@/lib/i18n'

interface MobileCardListProps {
  rows: Row<Game>[]
  selectable?: boolean
}

export function MobileCardList({ rows, selectable }: MobileCardListProps) {
  const t = useT()
  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
        {t('table.noResults')}
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const g = row.original
        const slug = slugify(g.url)
        return (
          <li key={g.url}>
            <article className="flex gap-3 rounded-md border bg-card p-3 hover:bg-accent/40">
              {selectable && (
                <div className="flex shrink-0 items-start pt-1">
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(v) => row.toggleSelected(!!v)}
                    aria-label={t('table.selectGame', { name: g.name })}
                  />
                </div>
              )}
              <Link
                to={`/games/${encodeURIComponent(slug)}`}
                className="flex min-w-0 flex-1 gap-3"
              >
                <GameThumb
                  src={g.thumbnail || undefined}
                  alt=""
                  width={72}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-[72px] shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-medium leading-tight">
                      {g.name}
                    </h3>
                    {g.rating && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        ★ {g.rating}
                      </span>
                    )}
                  </div>
                  {g.dev && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{g.dev}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {g.genre && (
                      <Badge variant="secondary" className="text-[10px]">
                        {g.genre}
                      </Badge>
                    )}
                    {g.status && (
                      <Badge
                        variant={g.status === 'Released' ? 'default' : 'outline'}
                        className="text-[10px]"
                      >
                        {g.status}
                      </Badge>
                    )}
                    {g.nsfw === 'Yes' && (
                      <Badge variant="destructive" className="text-[10px]">
                        NSFW
                      </Badge>
                    )}
                    {g.safe_virus && g.safe_virus !== '?' && (
                      <Badge variant="outline" className="text-[10px]">
                        {g.safe_virus}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
