import { useMemo } from 'react'
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { topMadeWith } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { chartAria, LEGEND_BASE, SERIES_ANIMATION, SLICE_STROKE, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { paletteFills } from './palette'

export function MadeWithChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => paletteFills(topMadeWith(games, 8)), [games])
  return (
    <ChartCard
      id="made-with"
      title={t('charts.madeWith.title')}
      description={t('charts.madeWith.desc')}
      table={{ label: t('games.filter.engine'), value: t('charts.series.games'), rows: tableRows(data) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart {...chartAria('made-with')}>
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
          />
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent />} />
          <Legend {...LEGEND_BASE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
