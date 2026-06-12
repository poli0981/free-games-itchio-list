import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { classifyOnline } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { PALETTE } from './palette'

export function OnlineOfflineChart({ games }: { games: Game[] }) {
  const t = useT()
  const split = useMemo(() => classifyOnline(games), [games])
  const data = [
    { key: t('charts.onlineOffline.online'), count: split.online },
    { key: t('charts.onlineOffline.offline'), count: split.offline },
  ]
  return (
    <ChartCard title={t('charts.onlineOffline.title')} description={t('charts.onlineOffline.desc')}>
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
