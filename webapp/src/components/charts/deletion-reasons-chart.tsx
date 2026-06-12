import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { deletionReasonCounts } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { DeletedGameEntry } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function DeletionReasonsChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const t = useT()
  const data = useMemo(() => deletionReasonCounts(deleted), [deleted])
  return (
    <ChartCard title={t('charts.deletionReasons.title')} description={t('charts.deletionReasons.desc')}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="key" innerRadius="50%" outerRadius="80%" paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
