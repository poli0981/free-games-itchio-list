import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { aiLabel } from '@/lib/ai-disclosure'
import { aiDisclosureCounts } from '@/lib/analytics'
import { AI_ASSISTED, AI_NONE, AI_UNDISCLOSED } from '@/lib/game-filters'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { SLICE_STROKE, TOOLTIP_BASE } from './chart-theme'
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
    () => aiDisclosureCounts(games).map((e) => ({ ...e, label: aiLabel(e.key, t) })),
    [games, t],
  )
  const total = data.reduce((sum, d) => sum + d.count, 0)
  return (
    <ChartCard title={t('charts.ai.title')} description={t('charts.ai.desc')}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius="50%"
            outerRadius="80%"
            paddingAngle={2}
            stroke={SLICE_STROKE}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={COLOR[d.key] ?? PALETTE[8]} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent total={total} />} />
          {/* The data's order (no AI, AI-assisted, not disclosed), not Recharts' alphabetical default. */}
          <Legend itemSorter={(item) => data.findIndex((d) => d.label === item.value)} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
