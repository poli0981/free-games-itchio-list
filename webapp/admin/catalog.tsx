import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAllGames, useDeletedGames } from '@/hooks/useGames'
import { cn } from '@/lib/utils'
import type { Game } from '@/types/game'
import { adminApi, errorText, shortSha, type GameEdit } from './api'
import { Notice, PUBLISH_NOTE } from './app'

const MAX_RESULTS = 50

function matches(query: string, ...fields: string[]): boolean {
  const q = query.trim().toLowerCase()
  return q.length > 0 && fields.some((f) => f.toLowerCase().includes(q))
}

export function CatalogPage() {
  const games = useAllGames()
  const deleted = useDeletedGames()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Game | null>(null)
  const [tab, setTab] = useState<'catalog' | 'removed'>('catalog')

  const found = useMemo(
    () => (games.data?.games ?? []).filter((g) => matches(query, g.name, g.url, g.dev)).slice(0, MAX_RESULTS),
    [games.data, query],
  )
  const removed = useMemo(
    () => (deleted.data ?? []).filter((d) => !query.trim() || matches(query, d.name, d.url)).slice(-MAX_RESULTS).reverse(),
    [deleted.data, query],
  )

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div>
        <div className="mb-3 flex gap-1 text-sm" role="tablist" aria-label="Catalog or removed games">
          {(['catalog', 'removed'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn('rounded-md px-3 py-1.5 hover:bg-accent', tab === t && 'bg-accent font-medium')}
            >
              {t === 'catalog' ? `Catalog ${games.data ? `(${games.data.games.length})` : ''}` : 'Removed'}
            </button>
          ))}
        </div>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, developer or URL"
          aria-label="Search games"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Data of the published site; edits apply to the latest repository state.
        </p>
        {tab === 'catalog' ? (
          <ul className="mt-3 divide-y text-sm">
            {games.isPending && <li className="py-2 text-muted-foreground">Loading catalog…</li>}
            {found.map((g) => (
              <li key={g.url}>
                <button
                  onClick={() => setSelected(g)}
                  className={cn('w-full py-2 text-left hover:bg-accent/50', selected?.url === g.url && 'bg-accent')}
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="block text-xs text-muted-foreground">{g.url.replace('https://', '')}</span>
                </button>
              </li>
            ))}
            {query && games.data && found.length === 0 && <li className="py-2 text-muted-foreground">No match.</li>}
          </ul>
        ) : (
          <RemovedList entries={removed} />
        )}
      </div>
      <div>{selected && tab === 'catalog' && <GameEditor key={selected.url} game={selected} />}</div>
    </section>
  )
}

function GameEditor({ game }: { game: Game }) {
  const [edit, setEdit] = useState<Required<GameEdit>>({
    safe_virus: game.safe_virus,
    nsfw: game.nsfw,
    notes: game.notes ?? '',
  })
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null)

  const changed = (Object.keys(edit) as (keyof GameEdit)[]).filter((k) => edit[k] !== (game[k] ?? ''))
  const save = useMutation({
    mutationFn: () => adminApi.edit(game.url, Object.fromEntries(changed.map((k) => [k, edit[k]]))),
    onSuccess: (r) =>
      setNotice({
        tone: 'info',
        text: r.edited ? `Saved (${shortSha(r.sha)}). ${PUBLISH_NOTE}` : 'Nothing changed in the repository.',
      }),
    onError: (e) => setNotice({ tone: 'error', text: errorText(e) }),
  })
  const remove = useMutation({
    mutationFn: () => adminApi.remove(game.url, reason.trim()),
    onSuccess: (r) => setNotice({ tone: 'info', text: `Removed (${shortSha(r.sha)}); its resized covers were deleted. ${PUBLISH_NOTE}` }),
    onError: (e) => setNotice({ tone: 'error', text: errorText(e) }),
  })

  return (
    <div className="rounded-lg border p-4 text-sm">
      <h2 className="text-base font-semibold">{game.name}</h2>
      <a href={game.url} target="_blank" rel="noreferrer noopener" className="text-xs text-muted-foreground hover:underline">
        {game.url}
      </a>
      <div className="mt-4">{notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Virus check</span>
          <select
            value={edit.safe_virus}
            onChange={(e) => setEdit({ ...edit, safe_virus: e.target.value })}
            className="h-9 rounded-md border bg-background px-2"
          >
            {['?', 'Yes', 'No', 'Caution'].map((v) => (
              <option key={v} value={v}>
                {v === '?' ? 'Not checked (?)' : v}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">NSFW (18+)</span>
          <select
            value={edit.nsfw}
            onChange={(e) => setEdit({ ...edit, nsfw: e.target.value })}
            className="h-9 rounded-md border bg-background px-2"
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </label>
      </div>
      <label className="mt-3 grid gap-1">
        <span className="text-xs text-muted-foreground">Notes (public)</span>
        <textarea
          value={edit.notes}
          maxLength={2000}
          rows={3}
          onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
          className="rounded-md border bg-background p-2"
        />
      </label>
      <Button className="mt-3" disabled={!changed.length || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? 'Saving…' : 'Save'}
      </Button>

      <div className="mt-8 border-t pt-4">
        <h3 className="mb-1 font-medium text-destructive">Remove from the catalog</h3>
        <p className="mb-2 text-xs text-muted-foreground">
          The reason is public (removed-games list). Use this for content-removal requests too.
        </p>
        <div className="flex gap-2">
          <Input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="Reason" aria-label="Removal reason" />
          <Button
            variant="destructive"
            disabled={!reason.trim() || remove.isPending}
            onClick={() => {
              if (window.confirm(`Remove "${game.name}" from the catalog?`)) remove.mutate()
            }}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}

function RemovedList({ entries }: { entries: { url: string; name: string; reason: string; deleted_at: string }[] }) {
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null)
  const restore = useMutation({
    mutationFn: (url: string) => adminApi.restore(url),
    onSuccess: (r) =>
      setNotice({
        tone: 'info',
        text: r.queued ? `Queued for re-ingest (${shortSha(r.sha)}). ${PUBLISH_NOTE}` : 'Already queued.',
      }),
    onError: (e) => setNotice({ tone: 'error', text: errorText(e) }),
  })
  return (
    <div className="mt-3">
      {notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
      <ul className="divide-y text-sm">
        {entries.map((d) => (
          <li key={d.url} className="flex items-start gap-3 py-2">
            <div className="min-w-0 flex-1">
              <span className="font-medium">{d.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {d.deleted_at.slice(0, 10)} · {d.reason}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={restore.isPending}
              onClick={() => {
                if (window.confirm(`Bring "${d.name}" back? It is re-scraped; a paid game is dropped again.`)) {
                  restore.mutate(d.url)
                }
              }}
            >
              Restore
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
