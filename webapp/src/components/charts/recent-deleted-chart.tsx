import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'
import type { DeletedGameEntry } from '@/types/game'
import { ChartCard } from './chart-card'

export function RecentDeletedChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const recent = useMemo(
    () =>
      [...deleted]
        .sort((a, b) => (b.deleted_at ?? '').localeCompare(a.deleted_at ?? ''))
        .slice(0, 12),
    [deleted],
  )
  return (
    <ChartCard
      title="Recent Deletions"
      description={`Last ${recent.length} of ${formatNumber(deleted.length)} total`}
    >
      <div className="h-full overflow-y-auto pr-2">
        <ul className="space-y-1.5 text-sm">
          {recent.length === 0 ? (
            <p className="text-muted-foreground">No deletions logged.</p>
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
