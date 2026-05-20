import { useMemo } from 'react'
import { countByArray, topN } from '@/lib/analytics'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'

export function TopTagsChart({ games }: { games: Game[] }) {
  const data = useMemo(() => topN(countByArray(games, 'tags'), 30), [games])
  return (
    <ChartCard title="Top 30 Tags" description="Word-cloud-style ranking (sized by count)">
      <div className="flex h-full flex-wrap content-start items-baseline gap-2 overflow-y-auto p-2">
        {data.map((t) => {
          const fontSize = computeTagFontSize(t.count, data[0]?.count ?? 1)
          return (
            <span
              key={t.key}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.1 }}
              className="font-medium text-foreground/80 hover:text-foreground"
              title={`${t.count} games`}
            >
              {t.key}
            </span>
          )
        })}
      </div>
    </ChartCard>
  )
}

function computeTagFontSize(count: number, max: number): number {
  const min = 11
  const cap = 28
  const ratio = count / Math.max(1, max)
  return Math.round(min + (cap - min) * ratio)
}
