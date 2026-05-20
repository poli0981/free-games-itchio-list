import { useMemo } from 'react'
import { ResponsiveContainer, Tooltip, Treemap } from 'recharts'
import { genreTreemapData } from '@/lib/analytics'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'
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

// Custom cell renderer: hides the label on rectangles too small to fit it,
// so the treemap stays legible on narrow (mobile) viewports.
function TreemapCell(props: TreemapCellProps) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, depth = 1, name = '' } = props
  if (depth !== 1 || width <= 0 || height <= 0) return null
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={PALETTE[index % PALETTE.length]}
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
      {width > 56 && height > 24 && (
        <text x={x + 6} y={y + 18} fill="hsl(var(--background))" fontSize={12} fontWeight={600}>
          {name}
        </text>
      )}
    </g>
  )
}

export function GenreTreemapChart({ games }: { games: Game[] }) {
  const data = useMemo(() => genreTreemapData(games, 12), [games])
  // Recharts' Treemap data prop demands an index signature; our typed nodes
  // are valid treemap data at runtime, so cast through unknown.
  const treemapData = data as unknown as React.ComponentProps<typeof Treemap>['data']
  return (
    <ChartCard title="Genre Treemap" description="Top 12 genres sized by game count">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap data={treemapData} dataKey="size" nameKey="name" content={<TreemapCell />}>
          <Tooltip
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
        </Treemap>
      </ResponsiveContainer>
    </ChartCard>
  )
}
