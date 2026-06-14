import type { CountHistoryPoint, DeletedGameEntry, Game } from '@/types/game'
import { GameCountChart } from '@/components/charts/game-count-chart'
import { GenreChart } from '@/components/charts/genre-chart'
import { KpiCards } from '@/components/charts/kpi-cards'
import { MadeWithChart } from '@/components/charts/made-with-chart'
import { OnlineOfflineChart } from '@/components/charts/online-offline-chart'
import { StatusChart } from '@/components/charts/status-chart'

interface OverviewTabProps {
  games: Game[]
  deleted: DeletedGameEntry[]
  history: CountHistoryPoint[]
}

export default function OverviewTab({ games, deleted, history }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <KpiCards games={games} deleted={deleted} />
      <div className="grid gap-4 md:grid-cols-2">
        <GenreChart games={games} />
        <StatusChart games={games} />
        <OnlineOfflineChart games={games} />
        <MadeWithChart games={games} />
        <GameCountChart history={history} />
      </div>
    </div>
  )
}
