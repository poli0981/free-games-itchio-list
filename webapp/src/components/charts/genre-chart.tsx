import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { countBy, topN } from '@/lib/analytics'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function GenreChart({ games }: { games: Game[] }) {
  const data = useMemo(() => topN(countBy(games, 'genre'), 15), [games])
  return (
    <ChartCard title="Genres" description="Top 15 by game count">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="key" type="category" width={120} tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
