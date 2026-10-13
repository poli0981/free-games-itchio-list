import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { topByRatingCount } from '@/lib/analytics'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { BAR_CURSOR, SERIES_ANIMATION, TOOLTIP_BASE, truncateLabel } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function TopRatedCountChart({ games }: { games: Game[] }) {
  const t = useT()
  const fmt = useFormat()
  const data = useMemo(() => topByRatingCount(games, 10), [games])
  return (
    <ChartCard title={t('charts.topRatedCount.title')} description={t('charts.topRatedCount.desc')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tickFormatter={fmt.number} />
          <YAxis
            dataKey="key"
            type="category"
            width={140}
            interval={0}
            tick={{ fontSize: 11 }}
            tickFormatter={truncateLabel(20)}
          />
          <Tooltip {...TOOLTIP_BASE} cursor={BAR_CURSOR} content={<ChartTooltipContent />} />
          <Bar {...SERIES_ANIMATION} dataKey="count" name={t('charts.series.ratings')} fill={PALETTE[3]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
