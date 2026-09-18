import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'

const BUTTON =
  'h-10 rounded-[7px] border bg-card px-3 text-foreground enabled:hover:bg-accent disabled:text-muted-foreground disabled:opacity-60 md:h-[30px] md:px-2.5'

/** "1–100 of 440   Previous  1 / 5  Next". */
export function Pager({
  start,
  end,
  total,
  page,
  pages,
  onPage,
}: {
  start: number
  end: number
  total: number
  page: number
  pages: number
  onPage: (page: number) => void
}) {
  const t = useT()
  const fmt = useFormat()
  return (
    <nav aria-label={t('games.pages')} className="flex items-center justify-between gap-3 text-[13px] text-muted-foreground">
      <span className="font-mono">
        {t('games.range', { start: fmt.number(start), end: fmt.number(end), total: fmt.number(total) })}
      </span>
      {pages > 1 && (
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={BUTTON}>
            {t('games.prev')}
          </button>
          <span className="px-1.5 font-mono" aria-hidden="true">
            {page} / {pages}
          </span>
          <span className="sr-only">{t('games.pageStatus', { page, pages })}</span>
          <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className={BUTTON}>
            {t('games.next')}
          </button>
        </div>
      )}
    </nav>
  )
}
