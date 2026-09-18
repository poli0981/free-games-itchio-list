import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { computeKpis } from '@/lib/analytics'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { DeletedGameEntry, Game } from '@/types/game'

interface KpiCardsProps {
  games: Game[]
  deleted: DeletedGameEntry[]
  /** 18+ games left out of `games` (hidden until the visitor opts in); still counted here. */
  hiddenNsfw: number
}

export function KpiCards({ games, deleted, hiddenNsfw }: KpiCardsProps) {
  const t = useT()
  const fmt = useFormat()
  const kpis = useMemo(() => computeKpis(games, deleted), [games, deleted])
  const items = [
    { label: t('charts.kpi.totalGames'), value: fmt.number(kpis.totalGames + hiddenNsfw) },
    { label: t('charts.kpi.online'), value: fmt.number(kpis.onlineCount) },
    { label: t('charts.kpi.nsfw'), value: fmt.number(kpis.nsfwCount + hiddenNsfw) },
    { label: t('charts.kpi.deletedTotal'), value: fmt.number(kpis.totalDeleted) },
    { label: t('charts.kpi.avgRating'), value: fmt.rating(kpis.avgRating) },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
