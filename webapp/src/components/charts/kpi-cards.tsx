import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { computeKpis } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import { formatNumber } from '@/lib/utils'
import type { DeletedGameEntry, Game } from '@/types/game'

interface KpiCardsProps {
  games: Game[]
  deleted: DeletedGameEntry[]
}

export function KpiCards({ games, deleted }: KpiCardsProps) {
  const t = useT()
  const kpis = useMemo(() => computeKpis(games, deleted), [games, deleted])
  const items = [
    { label: t('charts.kpi.totalGames'), value: formatNumber(kpis.totalGames) },
    { label: t('charts.kpi.online'), value: formatNumber(kpis.onlineCount) },
    { label: t('charts.kpi.nsfw'), value: formatNumber(kpis.nsfwCount) },
    { label: t('charts.kpi.deletedTotal'), value: formatNumber(kpis.totalDeleted) },
    { label: t('charts.kpi.avgRating'), value: kpis.avgRating.toFixed(2) },
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
