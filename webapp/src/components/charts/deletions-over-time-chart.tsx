import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { deletionsByMonth } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { DeletedGameEntry } from '@/types/game'
import { ChartCard } from './chart-card'
import { BAR_CURSOR, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function DeletionsOverTimeChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const t = useT()
  const data = useMemo(() => deletionsByMonth(deleted), [deleted])
  return (
    <ChartCard title={t('charts.deletionsOverTime.title')} description={t('charts.deletionsOverTime.desc')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="key" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip {...TOOLTIP_BASE} cursor={BAR_CURSOR} content={<ChartTooltipContent />} />
          <Bar dataKey="count" name={t('charts.series.removed')} fill={PALETTE[1]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
