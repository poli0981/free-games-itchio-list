import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAllGames } from '@/hooks/useGames'
import { cn } from '@/lib/utils'
import type { Game } from '@/types/game'
import { MAX_BULK } from '../worker/limits'
import { BulkEditDialog, RemoveDialog, type Picked } from './dialogs'
import { useOverrides, withEdits } from './overrides'
import { useSelection } from './selection'
import { plural } from './texts'
import { Cover, SelectionBar, TabBar } from './ui'

const PAGE = 100
const DAY_MS = 86_400_000

type Days = '7' | '30'
type Choice = 'any' | string

/** Games the ingest added lately, newest first, to review their 18+ flag and virus check in bulk. */
export function NewGamesPage() {
  const games = useAllGames()
  const [days, setDays] = useState<Days>('7')
  const [nsfw, setNsfw] = useState<Choice>('any')
  const [virus, setVirus] = useState<Choice>('any')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [dialog, setDialog] = useState<{ kind: 'edit' | 'remove'; games: Picked[] } | null>(null)
  const selection = useSelection()
  const { edits, removed } = useOverrides()

  // "Now" is when the catalog was loaded (rendering must not read the clock).
  const loadedAt = games.dataUpdatedAt
  const recent = useMemo(() => {
    if (!games.data || !loadedAt) return []
    const cutoff = new Date(loadedAt - Number(days) * DAY_MS).toISOString()
    return games.data.games
      .filter((g) => (g.added_at ?? '') >= cutoff)
      .sort((a, b) => (b.added_at ?? '').localeCompare(a.added_at ?? '') || a.name.localeCompare(b.name))
  }, [games.data, loadedAt, days])
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recent
      .map((g) => withEdits(g, edits))
      .filter(
        (g) =>
          (nsfw === 'any' || g.nsfw === nsfw) &&
          (virus === 'any' || g.safe_virus === virus) &&
          (!q || g.name.toLowerCase().includes(q) || g.dev.toLowerCase().includes(q) || g.url.includes(q)),
      )
  }, [recent, edits, nsfw, virus, query])
  const pages = Math.max(1, Math.ceil(shown.length / PAGE))
  const current = Math.min(page, pages - 1)
  const rows = shown.slice(current * PAGE, (current + 1) * PAGE)
  const byUrl = new Map(recent.map((g) => [g.url, g]))
  const picked: Picked[] = [...selection.selected].map((url) => ({ url, name: byUrl.get(url)?.name ?? url }))
  const selectable = rows.filter((g) => !removed.has(g.url))

  const filter = (label: string, value: Choice, onChange: (v: Choice) => void, options: string[]) => (
    <label className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setPage(0)
        }}
        className="h-8 rounded-md border bg-background px-2"
      >
        <option value="any">any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <section>
      <h1 className="mb-1 text-lg font-semibold">New games</h1>
      <p className="mb-3 text-sm text-muted-foreground">
        Added by the ingest workflow lately (published data). Check the 18+ flag and the virus check, in bulk.
      </p>
      <TabBar
        label="Added within"
        value={days}
        onChange={(d) => {
          setDays(d)
          setPage(0)
        }}
        options={[
          { id: '7', label: 'Last 7 days' },
          { id: '30', label: 'Last 30 days' },
        ]}
      />
      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0)
          }}
          placeholder="Filter by name, developer or URL"
          aria-label="Filter new games"
          className="max-w-xs"
        />
        {filter('18+', nsfw, setNsfw, ['No', 'Yes'])}
        {filter('Virus check', virus, setVirus, ['?', 'Yes', 'No', 'Caution'])}
        <span className="text-muted-foreground">
          {games.isPending ? 'Loading…' : `${plural(shown.length, 'game')} of ${recent.length.toLocaleString('en-GB')}`}
        </span>
        <button
          className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
          disabled={selectable.length === 0 || selection.full}
          onClick={() => selection.setMany(selectable.map((g) => g.url), true)}
        >
          Select this page
        </button>
      </div>

      <SelectionBar count={selection.selected.size} max={MAX_BULK} onClear={selection.clear}>
        <Button size="sm" variant="outline" onClick={() => setDialog({ kind: 'edit', games: picked })}>
          Edit…
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setDialog({ kind: 'remove', games: picked })}>
          Remove…
        </Button>
      </SelectionBar>

      <ul className="divide-y text-sm">
        {rows.map((g) => (
          <NewGameRow
            key={g.url}
            game={g}
            removed={removed.has(g.url)}
            selected={selection.selected.has(g.url)}
            disabled={!selection.selected.has(g.url) && selection.full}
            onToggle={() => selection.toggle(g.url)}
          />
        ))}
        {!games.isPending && rows.length === 0 && <li className="py-3 text-muted-foreground">No game added in that period matches.</li>}
      </ul>

      {pages > 1 && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <Button size="sm" variant="outline" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Previous
          </Button>
          <span className="tabular-nums text-muted-foreground">
            Page {current + 1} of {pages}
          </span>
          <Button size="sm" variant="outline" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
            Next
          </Button>
        </div>
      )}

      {dialog?.kind === 'edit' && <BulkEditDialog games={dialog.games} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'remove' && (
        <RemoveDialog games={dialog.games} onClose={() => setDialog(null)} onRemoved={(urls) => selection.setMany(urls, false)} />
      )}
    </section>
  )
}

function NewGameRow({
  game,
  removed,
  selected,
  disabled,
  onToggle,
}: {
  game: Game
  removed: boolean
  selected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <li className={cn('flex items-center gap-3 py-2', removed && 'opacity-50')}>
      <input type="checkbox" aria-label={`Select ${game.name}`} checked={selected} disabled={removed || disabled} onChange={onToggle} />
      <Cover src={game.thumbnail} className="h-12 w-16 shrink-0" />
      <div className="min-w-0 flex-1">
        <a href={game.url} target="_blank" rel="noreferrer noopener" className="font-medium hover:underline">
          {game.name}
        </a>
        <span className="ml-2 text-xs text-muted-foreground">{game.dev}</span>
        {removed && <span className="ml-2 text-xs text-destructive">removed (publishing…)</span>}
        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          <Badge variant={game.nsfw === 'Yes' ? 'destructive' : 'outline'}>18+: {game.nsfw}</Badge>
          <Badge variant={game.safe_virus === '?' ? 'secondary' : 'outline'}>virus check: {game.safe_virus}</Badge>
          {game.genre && game.genre !== 'N/A' && <Badge variant="outline">{game.genre}</Badge>}
        </div>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{game.added_at?.slice(0, 10)}</span>
    </li>
  )
}
