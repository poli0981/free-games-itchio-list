import { useMemo } from 'react'
import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { aiLabel } from '@/lib/ai-disclosure'
import { aiDisclosureCounts } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { AI_ASSISTED, AI_NONE, AI_UNDISCLOSED } from '@/lib/game-filters'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { chartAria, LEGEND_BASE, SERIES_ANIMATION, SLICE_STROKE, TOOLTIP_BASE } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { NEUTRAL, PALETTE } from './palette'

// Blue / orange / gray stay apart for colour-blind readers on both themes.
const COLOR: Record<string, string> = {
  [AI_NONE]: PALETTE[4],
  [AI_ASSISTED]: PALETTE[6],
  [AI_UNDISCLOSED]: NEUTRAL,
}

export function AiDisclosureChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(
    () =>
      aiDisclosureCounts(games).map((e) => ({
        ...e,
        label: aiLabel(e.key, t),
        fill: COLOR[e.key] ?? PALETTE[8],
      })),
    [games, t],
  )
  const total = data.reduce((sum, d) => sum + d.count, 0)
  return (
    <ChartCard
      id="ai-disclosure"
      title={t('charts.ai.title')}
      description={t('charts.ai.desc')}
      table={{
        label: t('games.filter.ai'),
        value: t('charts.series.games'),
        rows: tableRows(
          data.map((d) => ({ key: d.label, count: d.count })),
          total,
        ),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart {...chartAria('ai-disclosure')}>
          <Pie
            {...SERIES_ANIMATION}
            rootTabIndex={-1}
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius="50%"
            outerRadius="80%"
            paddingAngle={2}
            stroke={SLICE_STROKE}
          />
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent total={total} />} />
          {/* In the data's order: no AI, AI-assisted, not disclosed. */}
          <Legend {...LEGEND_BASE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
