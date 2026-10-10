import type { Game } from '@/types/game'
import { AccessibilityChart } from '@/components/charts/accessibility-chart'
import { AiContentChart } from '@/components/charts/ai-content-chart'
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
      <AccessibilityChart games={games} />
      <AiContentChart games={games} />
    </div>
  )
}
