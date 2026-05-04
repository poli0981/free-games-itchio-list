import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  classifyOnline,
  countBy,
  countByArray,
  ratingHistogram,
  topMadeWith,
  topN,
  type CountEntry,
} from '@/lib/analytics'
import type { DeletedGameEntry, Game } from '@/types/game'
import { formatNumber } from '@/lib/utils'

const PALETTE = [
  'hsl(217 91% 60%)',
  'hsl(330 81% 60%)',
  'hsl(142 71% 45%)',
  'hsl(38 92% 50%)',
  'hsl(262 83% 58%)',
  'hsl(199 89% 48%)',
  'hsl(20 90% 55%)',
  'hsl(173 58% 39%)',
  'hsl(280 65% 60%)',
  'hsl(160 60% 45%)',
]

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
}

function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  )
}

export function GenreChart({ games }: { games: Game[] }) {
  const data = useMemo(() => topN(countBy(games, 'genre'), 15), [games])
  return (
    <ChartCard title="Genres" description="Top 15 by game count">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="key" type="category" width={120} tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function PlatformChart({ games }: { games: Game[] }) {
  const data = useMemo(() => countByArray(games, 'platforms'), [games])
  return (
    <ChartCard title="Platforms" description="Counted per game (a game may target several)">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="key"
            innerRadius="50%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function OnlineOfflineChart({ games }: { games: Game[] }) {
  const split = useMemo(() => classifyOnline(games), [games])
  const data = [
    { key: 'Online (HTML5)', count: split.online },
    { key: 'Offline only', count: split.offline },
  ]
  return (
    <ChartCard title="Online vs Offline" description="HTML5 means playable in the browser">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="key" innerRadius="50%" outerRadius="80%">
            <Cell fill={PALETTE[2]} />
            <Cell fill={PALETTE[3]} />
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function LanguagesChart({ games }: { games: Game[] }) {
  const data = useMemo(() => topN(countByArray(games, 'languages'), 10), [games])
  return (
    <ChartCard title="Top 10 Languages">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="key" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" fill={PALETTE[4]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function MadeWithChart({ games }: { games: Game[] }) {
  const data = useMemo(() => topMadeWith(games, 8), [games])
  return (
    <ChartCard title="Game Engines" description="Primary engine per game (made_with[0])">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="key" innerRadius="50%" outerRadius="80%" paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function RatingChart({ games }: { games: Game[] }) {
  const data = useMemo(() => ratingHistogram(games, 10), [games])
  return (
    <ChartCard title="Rating Histogram" description="Bins of 0.5 stars from 0 to 5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="key" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" fill={PALETTE[5]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function StatusChart({ games }: { games: Game[] }) {
  const data = useMemo(() => countBy(games, 'status'), [games])
  return (
    <ChartCard title="Status Mix" description="Released vs prototype/in-progress">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="key" outerRadius="80%">
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export function AvgSessionChart({ games }: { games: Game[] }) {
  const data = useMemo(() => topN(countBy(games, 'average_session'), 8), [games])
  return (
    <ChartCard title="Average Session Length">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="key" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip
            cursor={{ fill: 'hsl(var(--accent))' }}
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
          />
          <Bar dataKey="count" fill={PALETTE[6]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

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

export function RecentDeletedChart({ deleted }: { deleted: DeletedGameEntry[] }) {
  const recent = useMemo(
    () =>
      [...deleted]
        .sort((a, b) => (b.deleted_at ?? '').localeCompare(a.deleted_at ?? ''))
        .slice(0, 12),
    [deleted],
  )
  return (
    <ChartCard title="Recent Deletions" description={`Last ${recent.length} of ${formatNumber(deleted.length)} total`}>
      <div className="h-full overflow-y-auto pr-2">
        <ul className="space-y-1.5 text-sm">
          {recent.length === 0 ? (
            <p className="text-muted-foreground">No deletions logged.</p>
          ) : (
            recent.map((d) => (
              <li key={`${d.url}-${d.deleted_at}`} className="flex items-center justify-between gap-2 border-b py-1 last:border-0">
                <span className="truncate font-medium">{d.name}</span>
                <Badge variant="outline" className="flex-shrink-0 text-xs">
                  {d.reason}
                </Badge>
              </li>
            ))
          )}
        </ul>
      </div>
    </ChartCard>
  )
}

export function topGenresList(entries: CountEntry[]): string {
  return entries.slice(0, 3).map((e) => e.key).join(', ')
}
