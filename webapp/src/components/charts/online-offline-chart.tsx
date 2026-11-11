import { useMemo } from 'react'
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { classifyOnline } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { chartAria, LEGEND_BASE, SERIES_ANIMATION, SLICE_STROKE, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function OnlineOfflineChart({ games }: { games: Game[] }) {
  const t = useT()
  const split = useMemo(() => classifyOnline(games), [games])
  // Blue and orange: apart in lightness and for colour-blind readers (green and amber were not).
  const data = [
    { key: t('charts.onlineOffline.online'), count: split.online, fill: PALETTE[4] },
    { key: t('charts.onlineOffline.offline'), count: split.offline, fill: PALETTE[6] },
  ]
  return (
    <ChartCard
      id="online-offline"
      title={t('charts.onlineOffline.title')}
      description={t('charts.onlineOffline.desc')}
      table={{
        label: t('charts.table.kind'),
        value: t('charts.series.games'),
        rows: tableRows(data, split.online + split.offline),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart {...chartAria('online-offline')}>
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
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent total={split.online + split.offline} />} />
          <Legend {...LEGEND_BASE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
