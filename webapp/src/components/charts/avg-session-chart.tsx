import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { countBy, topN } from '@/lib/analytics'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function AvgSessionChart({ games }: { games: Game[] }) {
  const data = useMemo(() => topN(countBy(games, 'average_session'), 8), [games])
  return (
    <ChartCard title="Average Session Length">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="key" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" fill={PALETTE[6]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
