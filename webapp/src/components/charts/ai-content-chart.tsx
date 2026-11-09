import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { countByArray } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { BAR_CURSOR, chartAria, SERIES_ANIMATION, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

/** What AI-assisted games used AI for; the orange of "AI-assisted" in the disclosure chart. */
export function AiContentChart({ games }: { games: Game[] }) {
  const t = useT()
  const fmt = useFormat()
  const data = useMemo(() => countByArray(games, 'ai_content'), [games])
  return (
    <ChartCard
      id="ai-content"
      title={t('charts.aiContent.title')}
      description={t('charts.aiContent.desc')}
      table={
        data.length
          ? { label: t('charts.table.use'), value: t('charts.series.games'), rows: tableRows(data) }
          : undefined
      }
    >
      {data.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('charts.empty')}</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart {...chartAria('ai-content')} data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} tickFormatter={fmt.number} />
            <YAxis dataKey="key" type="category" width={100} interval={0} tick={{ fontSize: 12 }} />
            <Tooltip {...TOOLTIP_BASE} cursor={BAR_CURSOR} content={<ChartTooltipContent />} />
            <Bar {...SERIES_ANIMATION} dataKey="count" name={t('charts.series.games')} fill={PALETTE[6]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
