import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CountHistoryPoint } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function GameCountChart({ history }: { history: CountHistoryPoint[] }) {
  return (
    <ChartCard title="Game Count Over Time" description="Total games in the catalog by day">
      {history.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No history data yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ left: 4, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} width={48} allowDecimals={false} domain={['auto', 'auto']} />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--accent))' }}
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
            />
            <Line type="monotone" dataKey="total" stroke={PALETTE[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
