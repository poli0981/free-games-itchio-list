import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { countByArray } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { chartAria, LEGEND_BASE, SERIES_ANIMATION, SLICE_STROKE, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function PlatformChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => countByArray(games, 'platforms'), [games])
  return (
    // No shares in the table: a game can count for several platforms.
    <ChartCard
      id="platform"
      title={t('charts.platform.title')}
      description={t('charts.platform.desc')}
      table={{ label: t('games.filter.platform'), value: t('charts.series.games'), rows: tableRows(data) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart {...chartAria('platform')}>
          <Pie
            {...SERIES_ANIMATION}
            rootTabIndex={-1}
            data={data}
            dataKey="count"
            nameKey="key"
            innerRadius="50%"
            outerRadius="80%"
            paddingAngle={2}
            stroke={SLICE_STROKE}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent />} />
          <Legend {...LEGEND_BASE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
