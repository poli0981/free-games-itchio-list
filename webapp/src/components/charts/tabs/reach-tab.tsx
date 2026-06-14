import type { DeletedGameEntry, Game } from '@/types/game'
import { AvgSessionChart } from '@/components/charts/avg-session-chart'
import { LanguagesChart } from '@/components/charts/languages-chart'
import { PlatformChart } from '@/components/charts/platform-chart'
import { RecentDeletedChart } from '@/components/charts/recent-deleted-chart'

interface ReachTabProps {
  games: Game[]
  deleted: DeletedGameEntry[]
}

export default function ReachTab({ games, deleted }: ReachTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PlatformChart games={games} />
      <LanguagesChart games={games} />
      <AvgSessionChart games={games} />
      <RecentDeletedChart deleted={deleted} />
    </div>
  )
}
