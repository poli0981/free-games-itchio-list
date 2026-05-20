import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { topByRatingCount } from '@/lib/analytics'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function TopRatedCountChart({ games }: { games: Game[] }) {
  const data = useMemo(() => topByRatingCount(games, 10), [games])
  return (
    <ChartCard title="Most Rated Games" description="Top 10 by number of ratings">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            dataKey="key"
            type="category"
            width={140}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" fill={PALETTE[3]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
