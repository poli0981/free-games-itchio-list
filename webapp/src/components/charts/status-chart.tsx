import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { countBy } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function StatusChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => countBy(games, 'status'), [games])
  return (
    <ChartCard title={t('charts.status.title')} description={t('charts.status.desc')}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="key" outerRadius="80%">
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
