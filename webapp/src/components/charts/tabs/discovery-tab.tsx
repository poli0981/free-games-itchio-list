import type { Game } from '@/types/game'
import { GenreTreemapChart } from '@/components/charts/genre-treemap-chart'
import { TopTagsChart } from '@/components/charts/top-tags-chart'

interface DiscoveryTabProps {
  games: Game[]
}

export default function DiscoveryTab({ games }: DiscoveryTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TopTagsChart games={games} />
      <GenreTreemapChart games={games} />
    </div>
  )
}
