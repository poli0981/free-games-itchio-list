import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type ChartTab = 'overview' | 'reach' | 'quality' | 'discovery'

/** A ChartCard while its tab loads: the same header lines and chart area, so nothing moves when it arrives. */
function CardSkeleton({ described, tall }: { described: boolean; tall?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-40 max-w-full" />
        {described && <Skeleton className="h-4 w-64 max-w-full" />}
      </CardHeader>
      <CardContent className={cn('h-72', tall && 'max-md:h-96')}>
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  )
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <Card key={i} className={i === 0 ? 'max-md:col-span-2' : undefined}>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-1 h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Each tab's cards in order: with a description line or not; the Genres chart is taller on phones.
const LAYOUT: Record<ChartTab, { described: boolean; tall?: boolean }[]> = {
  overview: [{ described: true, tall: true }, ...Array.from({ length: 5 }, () => ({ described: true }))],
  reach: [{ described: true }, { described: false }, { described: false }, { described: true }],
  quality: Array.from({ length: 4 }, () => ({ described: true })),
  discovery: Array.from({ length: 4 }, () => ({ described: true })),
}

export function TabSkeleton({ tab }: { tab: ChartTab }) {
  return (
    <div className="space-y-4" aria-busy="true">
      {tab === 'overview' && <KpiSkeleton />}
      <div className="grid gap-4 md:grid-cols-2">
        {LAYOUT[tab].map((card, i) => (
          <CardSkeleton key={i} {...card} />
        ))}
      </div>
    </div>
  )
}
