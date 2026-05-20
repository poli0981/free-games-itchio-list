import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { deletionsByMonth } from '@/lib/analytics'
import type { DeletedGameEntry } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function DeletionsOverTimeChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const data = useMemo(() => deletionsByMonth(deleted), [deleted])
  return (
    <ChartCard title="Deletions Over Time" description="Games removed per month">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="key" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" fill={PALETTE[1]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
