import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ratingHistogram } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { BAR_CURSOR, chartAria, SERIES_ANIMATION, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function RatingChart({ games }: { games: Game[] }) {
  const t = useT()
  const fmt = useFormat()
  const data = useMemo(() => ratingHistogram(games, 10), [games])
  return (
    <ChartCard
      id="rating"
      title={t('charts.rating.title')}
      description={t('charts.rating.desc')}
      table={{ label: t('games.filter.rating'), value: t('charts.series.games'), rows: tableRows(data) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...chartAria('rating')} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="key" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={fmt.number} />
          <Tooltip {...TOOLTIP_BASE} cursor={BAR_CURSOR} content={<ChartTooltipContent />} />
          <Bar {...SERIES_ANIMATION} dataKey="count" name={t('charts.series.games')} fill={PALETTE[5]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
