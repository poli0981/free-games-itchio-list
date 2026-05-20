import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { classifyOnline } from '@/lib/analytics'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function OnlineOfflineChart({ games }: { games: Game[] }) {
  const split = useMemo(() => classifyOnline(games), [games])
  const data = [
    { key: 'Online (HTML5)', count: split.online },
    { key: 'Offline only', count: split.offline },
  ]
  return (
    <ChartCard title="Online vs Offline" description="HTML5 means playable in the browser">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="key" innerRadius="50%" outerRadius="80%">
            <Cell fill={PALETTE[2]} />
            <Cell fill={PALETTE[3]} />
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
