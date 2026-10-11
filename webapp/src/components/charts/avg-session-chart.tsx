import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { countBy, topN } from '@/lib/analytics'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { useIsMobile } from '@/lib/use-is-mobile'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { BAR_CURSOR, singleLineTick, TOOLTIP_BASE, truncateLabel } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function AvgSessionChart({ games }: { games: Game[] }) {
  const t = useT()
  const fmt = useFormat()
  // Phones get horizontal bars, like the languages chart: the slanted labels overlap there.
  const isMobile = useIsMobile()
  const data = useMemo(() => topN(countBy(games, 'average_session'), 8), [games])
  return (
    <ChartCard title={t('charts.avgSession.title')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={isMobile ? 'vertical' : 'horizontal'}>
          <CartesianGrid horizontal={!isMobile} strokeDasharray="3 3" />
          {isMobile ? (
            <XAxis type="number" allowDecimals={false} tickFormatter={fmt.number} />
          ) : (
            <XAxis dataKey="key" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
          )}
          {isMobile ? (
            <YAxis
              dataKey="key"
              type="category"
              width={110}
              interval={0}
              tick={singleLineTick(11)}
              tickFormatter={truncateLabel(18)}
            />
          ) : (
            <YAxis tickFormatter={fmt.number} />
          )}
          <Tooltip {...TOOLTIP_BASE} cursor={BAR_CURSOR} content={<ChartTooltipContent />} />
          <Bar
            dataKey="count"
            name={t('charts.series.games')}
            fill={PALETTE[6]}
            radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
