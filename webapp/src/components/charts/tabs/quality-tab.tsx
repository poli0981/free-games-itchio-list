import type { DeletedGameEntry, Game } from '@/types/game'
import { DeletionReasonsChart } from '@/components/charts/deletion-reasons-chart'
import { DeletionsOverTimeChart } from '@/components/charts/deletions-over-time-chart'
import { RatingChart } from '@/components/charts/rating-chart'
import { TopRatedCountChart } from '@/components/charts/top-rated-count-chart'

interface QualityTabProps {
  games: Game[]
  deleted: DeletedGameEntry[]
}

export default function QualityTab({ games, deleted }: QualityTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <RatingChart games={games} />
      <TopRatedCountChart games={games} />
      <DeletionsOverTimeChart deleted={deleted} />
      <DeletionReasonsChart deleted={deleted} />
    </div>
  )
}
