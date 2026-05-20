import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { deletionReasonCounts } from '@/lib/analytics'
import type { DeletedGameEntry } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function DeletionReasonsChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const data = useMemo(() => deletionReasonCounts(deleted), [deleted])
  return (
    <ChartCard title="Deletion Reasons" description="Why games left the catalog">
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
