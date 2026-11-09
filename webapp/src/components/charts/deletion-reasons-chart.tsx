import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { deletionReasonCounts } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { useT } from '@/lib/i18n'
import type { DeletedGameEntry } from '@/types/game'
import { ChartCard } from './chart-card'
import { chartAria, LEGEND_BASE, SERIES_ANIMATION, SLICE_STROKE, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function DeletionReasonsChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const t = useT()
  const data = useMemo(() => deletionReasonCounts(deleted), [deleted])
  const total = data.reduce((sum, d) => sum + d.count, 0)
  return (
    <ChartCard
      id="deletion-reasons"
      title={t('charts.deletionReasons.title')}
      description={t('charts.deletionReasons.desc')}
      table={{ label: t('deleted.col.reason'), value: t('charts.series.removed'), rows: tableRows(data, total) }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart {...chartAria('deletion-reasons')}>
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
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent total={total} />} />
          <Legend {...LEGEND_BASE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
