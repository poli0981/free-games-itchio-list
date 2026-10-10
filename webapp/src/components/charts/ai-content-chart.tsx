import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { countByArray } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { BAR_CURSOR, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

/** What AI-assisted games used AI for; the orange of "AI-assisted" in the disclosure chart. */
export function AiContentChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => countByArray(games, 'ai_content'), [games])
  return (
    <ChartCard title={t('charts.aiContent.title')} description={t('charts.aiContent.desc')}>
      {data.length === 0 ? (
        <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('charts.empty')}</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis dataKey="key" type="category" width={100} tick={{ fontSize: 12 }} />
            <Tooltip {...TOOLTIP_BASE} cursor={BAR_CURSOR} content={<ChartTooltipContent />} />
            <Bar dataKey="count" name={t('charts.series.games')} fill={PALETTE[6]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
