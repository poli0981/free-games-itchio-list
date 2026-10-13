import { useMemo } from 'react'
import { ResponsiveContainer, Tooltip, Treemap, type TooltipPayloadEntry } from 'recharts'
import { genreTreemapData } from '@/lib/analytics'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
import { SERIES_ANIMATION, TOOLTIP_BASE, truncateLabel } from './chart-theme'
import { ChartTooltipContent } from './chart-tooltip'
import { PALETTE } from './palette'

interface TreemapCellProps {
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  depth?: number
  name?: string
}

/** Width of a 12px semibold Geist character, rounded up. */
const LABEL_CHAR_PX = 7

// Custom cell renderer: shortens the label to the rectangle's width ("Simul…")
// and hides it where not even three letters fit, so the treemap stays legible
// on narrow (mobile) viewports.
function TreemapCell(props: TreemapCellProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, depth = 1, name = '' } = props
  if (depth !== 1 || width <= 0 || height <= 0) return null
  const fits = Math.floor((width - 12) / LABEL_CHAR_PX)
  const label = name.length <= fits || fits >= 4 ? truncateLabel(fits)(name) : null
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={PALETTE[index % PALETTE.length]}
        stroke="var(--background)"
        strokeWidth={2}
      />
      {label && height > 24 && (
        <text x={x + 6} y={y + 18} fill="var(--background)" fontSize={12} fontWeight={600}>
          {label}
        </text>
      )}
    </g>
  )
}

// Tooltip entries carry no colour of their own here: use the cell's.
function cellColor(entry: TooltipPayloadEntry): string {
  const index = (entry.payload as { index?: number } | undefined)?.index ?? 0
  return PALETTE[index % PALETTE.length]
}

export function GenreTreemapChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => genreTreemapData(games, 12), [games])
  // Recharts' Treemap data prop demands an index signature; our typed nodes
  // are valid treemap data at runtime, so cast through unknown.
  const treemapData = data as unknown as React.ComponentProps<typeof Treemap>['data']
  return (
    <ChartCard title={t('charts.genreTreemap.title')} description={t('charts.genreTreemap.desc')}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap {...SERIES_ANIMATION} data={treemapData} dataKey="size" nameKey="name" content={<TreemapCell />}>
          <Tooltip {...TOOLTIP_BASE} content={<ChartTooltipContent colorOf={cellColor} />} />
        </Treemap>
      </ResponsiveContainer>
    </ChartCard>
  )
}
