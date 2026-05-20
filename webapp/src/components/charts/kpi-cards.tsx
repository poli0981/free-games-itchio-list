import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { computeKpis } from '@/lib/analytics'
import { formatNumber } from '@/lib/utils'
import type { DeletedGameEntry, Game } from '@/types/game'

interface KpiCardsProps {
  games: Game[]
  deleted: DeletedGameEntry[]
}

export function KpiCards({ games, deleted }: KpiCardsProps) {
  const kpis = useMemo(() => computeKpis(games, deleted), [games, deleted])
  const items = [
    { label: 'Total games', value: formatNumber(kpis.totalGames) },
    { label: 'Online (HTML5)', value: formatNumber(kpis.onlineCount) },
    { label: 'NSFW', value: formatNumber(kpis.nsfwCount) },
    { label: 'Deleted (total)', value: formatNumber(kpis.totalDeleted) },
    { label: 'Avg rating', value: kpis.avgRating.toFixed(2) },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
