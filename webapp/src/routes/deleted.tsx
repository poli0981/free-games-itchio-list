import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { ExtLink } from '@/components/ext-link'
import { RouteError } from '@/components/route-error'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeletedGames } from '@/hooks/useGames'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFormat } from '@/lib/format'
import { fold } from '@/lib/game-filters'
import { useT, type MessageKey } from '@/lib/i18n'

/** The pipeline's standard reasons get a translated label; anything else is shown as written. */
function reasonKey(reason: string): MessageKey | null {
  if (/no longer exists|HTTP 4(?:04|10)/i.test(reason)) return 'deleted.reason.gone'
  if (/became paid/i.test(reason)) return 'deleted.reason.paid'
  return null
}

export default function Removed() {
  const t = useT()
  const fmt = useFormat()
  useDocumentTitle(t('titles.deleted'))
  const deleted = useDeletedGames()
  const [find, setFind] = useState('')

  const sorted = useMemo(
    () => [...(deleted.data ?? [])].sort((a, b) => (b.deleted_at ?? '').localeCompare(a.deleted_at ?? '')),
    [deleted.data],
  )

  if (deleted.isError && !deleted.data) {
    return <RouteError error={deleted.error} onRetry={() => void deleted.refetch()} />
  }

  const needle = fold(find.trim())
  const shown = needle ? sorted.filter((d) => fold(`${d.name} ${d.url}`).includes(needle)) : sorted

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-4 pt-6 pb-12 sm:px-8 md:pt-7">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{t('titles.deleted')}</h1>
        <p className="max-w-[680px] text-sm leading-relaxed text-muted-foreground">{t('deleted.intro')}</p>
        {!deleted.isPending && (
          <p className="font-mono text-xs text-muted-foreground">
            {t(sorted.length === 1 ? 'deleted.count.one' : 'deleted.count', { count: fmt.number(sorted.length) })}
          </p>
        )}
      </div>

      {sorted.length > 10 && (
        <label className="flex h-11 items-center gap-2 rounded-[10px] border bg-card px-3 text-muted-foreground focus-within:border-primary md:h-[34px] md:w-80 md:rounded-lg">
          <Search className="size-4 shrink-0 md:size-[15px]" aria-hidden="true" />
          <input
            type="search"
            value={find}
            onChange={(e) => setFind(e.target.value)}
            placeholder={t('deleted.search')}
            aria-label={t('deleted.search')}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-hidden placeholder:text-muted-foreground md:text-[13px]"
          />
        </label>
      )}

      {deleted.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          {sorted.length === 0 ? t('deleted.empty') : t('games.filter.none')}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div
            aria-hidden="true"
            className="hidden h-10 grid-cols-[minmax(0,1fr)_220px_130px] items-center gap-4 border-b px-4 text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase md:grid"
          >
            <span>{t('games.col.game')}</span>
            <span>{t('deleted.col.reason')}</span>
            <span className="text-right">{t('deleted.col.date')}</span>
          </div>
          <ul>
            {shown.map((d) => {
              const key = reasonKey(d.reason)
              return (
                <li
                  key={`${d.url}-${d.deleted_at}`}
                  data-row
                  className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b px-4 py-2.5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_220px_130px]"
                >
                  <span className="flex min-w-0 flex-col max-md:col-start-1 max-md:row-start-1">
                    <ExtLink href={d.url} className="truncate text-sm font-medium hover:underline">
                      {d.name || d.url}
                    </ExtLink>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {d.url.replace(/^https?:\/\//, '')}
                    </span>
                  </span>
                  <span className="text-[13px] text-muted-foreground max-md:col-start-1 max-md:row-start-2" title={d.reason}>
                    {key ? t(key) : d.reason}
                  </span>
                  <span className="text-right font-mono text-xs text-muted-foreground max-md:col-start-2 max-md:row-start-1">
                    {fmt.date(d.deleted_at)}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
