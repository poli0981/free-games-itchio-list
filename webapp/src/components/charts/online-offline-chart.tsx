import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { classifyOnline } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { SLICE_STROKE, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
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
          <Pie data={data} dataKey="count" nameKey="key" innerRadius="50%" outerRadius="80%" stroke={SLICE_STROKE}>
            <Cell fill={PALETTE[2]} />
            <Cell fill={PALETTE[3]} />
          </Pie>
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent total={split.online + split.offline} />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
