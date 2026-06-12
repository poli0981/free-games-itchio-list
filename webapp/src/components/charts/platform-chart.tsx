import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { countByArray } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function PlatformChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => countByArray(games, 'platforms'), [games])
  return (
    <ChartCard title={t('charts.platform.title')} description={t('charts.platform.desc')}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="key"
            innerRadius="50%"
            outerRadius="80%"
            paddingAngle={2}
          >
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
