import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/lib/i18n'
import { formatNumber } from '@/lib/utils'
import type { DeletedGameEntry } from '@/types/game'
import { ChartCard } from './chart-card'

export function RecentDeletedChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const t = useT()
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
      description={t('charts.recentDeleted.desc', { shown: recent.length, total: formatNumber(deleted.length) })}
    >
      <div className="h-full overflow-y-auto pr-2">
        <ul className="space-y-1.5 text-sm">
          {recent.length === 0 ? (
            <p className="text-muted-foreground">{t('charts.recentDeleted.empty')}</p>
          ) : (
            recent.map((d) => (
              <li
                key={`${d.url}-${d.deleted_at}`}
                className="flex items-center justify-between gap-2 border-b py-1 last:border-0"
              >
                <span className="truncate font-medium">{d.name}</span>
                <Badge variant="outline" className="flex-shrink-0 text-xs">
                  {d.reason}
                </Badge>
              </li>
            ))
          )}
        </ul>
      </div>
    </ChartCard>
  )
}
