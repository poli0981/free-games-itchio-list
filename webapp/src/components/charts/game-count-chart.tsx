import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { CountHistoryPoint } from '@/types/game'
import { ChartCard } from './chart-card'
import { LINE_CURSOR, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function GameCountChart({ history }: { history: CountHistoryPoint[] }) {
  const t = useT()
  const fmt = useFormat()
  return (
    <ChartCard title={t('charts.gameCount.title')} description={t('charts.gameCount.desc')}>
      {history.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t('charts.gameCount.empty')}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ left: 4, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={24} />
            <YAxis tick={{ fontSize: 11 }} width={48} allowDecimals={false} domain={['auto', 'auto']} />
            <Tooltip
              {...TOOLTIP_BASE}
              cursor={LINE_CURSOR}
              content={<ChartTooltipContent labelFormat={fmt.date} />}
            />
            <Line
              type="monotone"
              dataKey="total"
              name={t('charts.series.games')}
              stroke={PALETTE[0]}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
