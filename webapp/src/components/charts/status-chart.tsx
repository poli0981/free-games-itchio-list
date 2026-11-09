import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { countBy } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { chartAria, LEGEND_BASE, SERIES_ANIMATION, SLICE_STROKE, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function StatusChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => countBy(games, 'status'), [games])
  const total = data.reduce((sum, d) => sum + d.count, 0)
  return (
    <ChartCard
      id="status"
      title={t('charts.status.title')}
      description={t('charts.status.desc')}
      table={{ label: t('games.filter.status'), value: t('charts.series.games'), rows: tableRows(data, total) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart {...chartAria('status')}>
          <Pie
            {...SERIES_ANIMATION}
            rootTabIndex={-1}
            data={data}
            dataKey="count"
            nameKey="key"
            outerRadius="80%"
            stroke={SLICE_STROKE}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent total={total} />} />
          <Legend {...LEGEND_BASE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
