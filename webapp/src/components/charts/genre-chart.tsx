import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { countBy, topN } from '@/lib/analytics'
import { useFormat } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { BAR_CURSOR, SERIES_ANIMATION, singleLineTick, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

export function GenreChart({ games }: { games: Game[] }) {
  const t = useT()
  const fmt = useFormat()
  const data = useMemo(() => topN(countBy(games, 'genre'), 15), [games])
  return (
    // Taller on phones, where the cards stack: 15 rows get room to breathe.
    <ChartCard title={t('charts.genre.title')} description={t('charts.genre.desc')} contentClassName="max-md:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={fmt.number} />
          {/* interval 0: every label. The default drops those whose line box doesn't
              fit the row, which hid every other genre, the largest two included. */}
          <YAxis dataKey="key" type="category" width={120} interval={0} tick={singleLineTick(12)} />
          <Tooltip {...TOOLTIP_BASE} cursor={BAR_CURSOR} content={<ChartTooltipContent />} />
          <Bar {...SERIES_ANIMATION} dataKey="count" name={t('charts.series.games')} fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
