import { useMemo } from 'react'
import { countByArray, topN } from '@/lib/analytics'
import { tableRows } from '@/lib/chart-table'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'
import { ChartCard } from './chart-card'

export function TopTagsChart({ games }: { games: Game[] }) {
  const t = useT()
  const data = useMemo(() => topN(countByArray(games, 'tags'), 30), [games])
  return (
    // The counts are shown only by size here (and in a hover title): the table reads them out.
    <ChartCard
      id="top-tags"
      title={t('charts.topTags.title')}
      description={t('charts.topTags.desc')}
      keyboard={false}
      table={{ label: t('games.filter.tag'), value: t('charts.series.games'), rows: tableRows(data) }}
    >
      <div className="flex h-full flex-wrap content-start items-baseline gap-2 overflow-y-auto p-2">
        {data.map((tag) => {
          const fontSize = computeTagFontSize(tag.count, data[0]?.count ?? 1)
          return (
            <span
              key={tag.key}
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.1 }}
              className="font-medium text-foreground/80 hover:text-foreground"
              title={t(tag.count === 1 ? 'charts.topTags.tagTitle.one' : 'charts.topTags.tagTitle', { count: tag.count })}
            >
              {tag.key}
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
