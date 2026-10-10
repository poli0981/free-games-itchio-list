import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { countByArray, topN } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { BAR_CURSOR, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function AccessibilityChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => topN(countByArray(games, 'accessibility'), 10), [games])
  return (
    <ChartCard title={t('charts.accessibility.title')} description={t('charts.accessibility.desc')}>
      {data.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('charts.empty')}</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              dataKey="key"
              type="category"
              width={140}
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)}
            />
            <Tooltip {...TOOLTIP_BASE} cursor={BAR_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="count" name={t('charts.series.games')} fill={PALETTE[7]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
