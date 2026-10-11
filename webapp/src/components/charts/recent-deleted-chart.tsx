import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { reasonKey } from '@/lib/deleted-reason'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { DeletedGameEntry } from '@/types/game'
import { ChartCard } from './chart-card'

export function RecentDeletedChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const t = useT()
  const fmt = useFormat()
  const recent = useMemo(
    () =>
      [...deleted]
        .sort((a, b) => (b.deleted_at ?? '').localeCompare(a.deleted_at ?? ''))
        .slice(0, 12),
    [deleted],
  )
  return (
    <ChartCard
      title={t('charts.recentDeleted.title')}
      description={t('charts.recentDeleted.desc', { shown: recent.length, total: fmt.number(deleted.length) })}
    >
      <div className="h-full overflow-y-auto pr-2">
        <ul className="space-y-1.5 text-sm">
          {recent.length === 0 ? (
            <p className="text-muted-foreground">{t('charts.recentDeleted.empty')}</p>
          ) : (
            recent.map((d) => {
              const key = reasonKey(d.reason)
              return (
                // Phones: the reason goes under the name, which would otherwise shrink to a few letters.
                <li
                  key={`${d.url}-${d.deleted_at}`}
                  className="flex items-center justify-between gap-2 border-b py-1 last:border-0 max-md:flex-col max-md:items-start max-md:gap-0.5"
                >
                  <span className="truncate font-medium max-md:max-w-full">{d.name}</span>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs max-md:block max-md:max-w-full max-md:truncate"
                    title={d.reason}
                  >
                    {key ? t(key) : d.reason}
                  </Badge>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </ChartCard>
  )
}
