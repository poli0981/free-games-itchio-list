import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAllGames, useDeletedGames } from '@/hooks/useGames'
import { cn } from '@/lib/utils'
import type { Game } from '@/types/game'
import { MAX_BULK } from '../worker/limits'
import { adminApi, shortSha, type GameEdit } from './api'
import { confirm } from './confirm'
import { BulkEditDialog, RemoveDialog, type Picked } from './dialogs'
import { extractGameUrls } from './extract'
import { rememberEdits, useOverrides, withEdits } from './overrides'
import { useSelection } from './selection'
import { PUBLISH_NOTE, errorText, plural } from './texts'
import { useTracking } from './tracking'
import { Notice, SelectionBar, TabBar, type NoticeState } from './ui'

const MAX_RESULTS = 50

function matches(query: string, ...fields: string[]): boolean {
  const q = query.trim().toLowerCase()
  return q.length > 0 && fields.some((f) => f.toLowerCase().includes(q))
}

type Tab = 'catalog' | 'removed' | 'list'

export function CatalogPage() {
  const games = useAllGames()
  const deleted = useDeletedGames()
  const [tab, setTab] = useState<Tab>('catalog')

  return (
    <section>
      <TabBar
        label="Catalog, removed games or removal by list"
        value={tab}
        onChange={setTab}
        options={[
          { id: 'catalog', label: `Catalog ${games.data ? `(${games.data.games.length.toLocaleString('en-GB')})` : ''}` },
          { id: 'removed', label: 'Removed' },
          { id: 'list', label: 'Remove by list' },
        ]}
      />
      <p className="mb-3 text-xs text-muted-foreground">
        Data of the published site; changes apply to the latest repository state and show here at once.
      </p>
      {tab === 'catalog' && <CatalogSearch games={games.data?.games ?? []} loading={games.isPending} />}
      {tab === 'removed' && <RemovedList entries={deleted.data ?? []} />}
      {tab === 'list' && <RemoveByList games={games.data?.games ?? []} deleted={deleted.data ?? []} />}
    </section>
  )
}

/** Search, select up to 100 games for a bulk edit or removal, or edit one in detail. */
function CatalogSearch({ games, loading }: { games: Game[]; loading: boolean }) {
  const [query, setQuery] = useState('')
  const [onlySelected, setOnlySelected] = useState(false)
  const [focused, setFocused] = useState<Game | null>(null)
  const [dialog, setDialog] = useState<{ kind: 'edit' | 'remove'; games: Picked[] } | null>(null)
  const selection = useSelection()
  const { edits, removed } = useOverrides()

  const byUrl = useMemo(() => new Map(games.map((g) => [g.url, g])), [games])
  const found = useMemo(() => {
    const list = onlySelected
      ? [...selection.selected].map((u) => byUrl.get(u)).filter((g): g is Game => g !== undefined)
      : games.filter((g) => matches(query, g.name, g.url, g.dev)).slice(0, MAX_RESULTS)
    return list.map((g) => withEdits(g, edits))
  }, [games, byUrl, query, onlySelected, selection.selected, edits])
  const picked: Picked[] = [...selection.selected].map((url) => ({ url, name: byUrl.get(url)?.name ?? url }))
  const selectable = found.filter((g) => !removed.has(g.url))

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOnlySelected(false)
          }}
          placeholder="Search by name, developer or URL"
          aria-label="Search games"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <button
            className="underline-offset-4 hover:underline disabled:opacity-50"
            disabled={selectable.length === 0 || selection.full}
            onClick={() => selection.setMany(selectable.map((g) => g.url), true)}
          >
            Select shown
          </button>
          <button
            className="underline-offset-4 hover:underline disabled:opacity-50"
            disabled={selection.selected.size === 0}
            onClick={() => setOnlySelected((v) => !v)}
          >
            {onlySelected ? 'Show search results' : `Show selected (${selection.selected.size})`}
          </button>
          {!onlySelected && query && found.length === MAX_RESULTS && <span>first {MAX_RESULTS} matches</span>}
        </div>

        <SelectionBar count={selection.selected.size} max={MAX_BULK} onClear={selection.clear}>
          <Button size="sm" variant="outline" onClick={() => setDialog({ kind: 'edit', games: picked })}>
            Edit…
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDialog({ kind: 'remove', games: picked })}>
            Remove…
          </Button>
        </SelectionBar>

        <ul className="mt-3 divide-y text-sm">
          {loading && <li className="py-2 text-muted-foreground">Loading catalog…</li>}
          {found.map((g) => {
            const gone = removed.has(g.url)
            return (
              <li key={g.url} className={cn('flex items-center gap-3', gone && 'opacity-50')}>
                <input
                  type="checkbox"
                  aria-label={`Select ${g.name}`}
                  disabled={gone || (!selection.selected.has(g.url) && selection.full)}
                  checked={selection.selected.has(g.url)}
                  onChange={() => selection.toggle(g.url)}
                />
                <button
                  onClick={() => setFocused(g)}
                  className={cn('min-w-0 flex-1 py-2 text-left hover:bg-accent/50', focused?.url === g.url && 'bg-accent')}
                >
                  <span className="font-medium">{g.name}</span>
                  {gone && <span className="ml-2 text-xs text-destructive">removed (publishing…)</span>}
                  {g.nsfw === 'Yes' && <span className="ml-2 text-xs text-muted-foreground">18+</span>}
                  <span className="block truncate text-xs text-muted-foreground">{g.url.replace('https://', '')}</span>
                </button>
              </li>
            )
          })}
          {query && !loading && found.length === 0 && <li className="py-2 text-muted-foreground">No match.</li>}
        </ul>
      </div>
      <div>
        {focused && (
          <GameEditor
            key={focused.url}
            game={withEdits(focused, edits)}
            removed={removed.has(focused.url)}
            onRemove={() => setDialog({ kind: 'remove', games: [{ url: focused.url, name: focused.name }] })}
          />
        )}
      </div>

      {dialog?.kind === 'edit' && <BulkEditDialog games={dialog.games} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'remove' && (
        <RemoveDialog games={dialog.games} onClose={() => setDialog(null)} onRemoved={(urls) => selection.setMany(urls, false)} />
      )}
    </div>
  )
}

type EditableValues = Required<GameEdit>
const EDITABLE = ['safe_virus', 'nsfw', 'notes'] as const

function values(game: Game): EditableValues {
  return { safe_virus: game.safe_virus, nsfw: game.nsfw, notes: game.notes ?? '' }
}

/** One game in detail. `game` carries the edits saved in this session (the published data lags). */
function GameEditor({ game, removed, onRemove }: { game: Game; removed: boolean; onRemove: () => void }) {
  const known = values(game)
  const [edit, setEdit] = useState<EditableValues>(known)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const changed = EDITABLE.filter((k) => edit[k] !== known[k])
  const save = async () => {
    const sent: GameEdit = Object.fromEntries(changed.map((k) => [k, edit[k]]))
    setSaving(true)
    try {
      const r = await adminApi.edit(game.url, sent)
      rememberEdits([{ url: game.url, edit: sent }])
      setNotice({ tone: 'info', text: r.edited ? `Saved (${shortSha(r.sha)}). ${PUBLISH_NOTE}` : 'Nothing changed in the repository.' })
    } catch (e) {
      setNotice({ tone: 'error', text: errorText(e) })
    } finally {
      setSaving(false)
    }
  }
  const change = (next: EditableValues) => {
    setEdit(next)
    if (notice?.tone === 'info') setNotice(null)
  }

  return (
    <div className="rounded-lg border p-4 text-sm">
      <h2 className="text-base font-semibold">{game.name}</h2>
      <a href={game.url} target="_blank" rel="noreferrer noopener" className="text-xs text-muted-foreground hover:underline">
        {game.url}
      </a>
      {game.added_at && <p className="mt-1 text-xs text-muted-foreground">Added {game.added_at.slice(0, 10)}</p>}
      <div className="mt-4">{notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs text-muted-foreground">Virus check</span>
          <select
            value={edit.safe_virus}
            onChange={(e) => change({ ...edit, safe_virus: e.target.value })}
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
            onChange={(e) => change({ ...edit, nsfw: e.target.value })}
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
          onChange={(e) => change({ ...edit, notes: e.target.value })}
          className="rounded-md border bg-background p-2"
        />
      </label>
      <Button className="mt-3" disabled={!changed.length || saving || removed} onClick={() => void save()}>
        {saving ? 'Saving…' : 'Save'}
      </Button>

      <div className="mt-8 border-t pt-4">
        <h3 className="mb-1 font-medium text-destructive">Remove from the catalog</h3>
        <p className="mb-2 text-xs text-muted-foreground">
          The reason is public (Removed page). Use this for content-removal requests too.
        </p>
        <Button variant="destructive" disabled={removed} onClick={onRemove}>
          {removed ? 'Removed' : 'Remove…'}
        </Button>
      </div>
    </div>
  )
}

function RemovedList({ entries }: { entries: { url: string; name: string; reason: string; deleted_at: string }[] }) {
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<NoticeState>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const client = useQueryClient()
  const track = useTracking((s) => s.track)
  const shown = useMemo(
    () => entries.filter((d) => !query.trim() || matches(query, d.name, d.url)).slice(-MAX_RESULTS).reverse(),
    [entries, query],
  )

  const restore = async (d: { url: string; name: string }) => {
    const ok = await confirm({
      title: `Bring “${d.name}” back?`,
      body: 'It is re-checked by the ingest workflow; if it is still paid or gone, it stays on the removed list.',
      action: 'Restore',
    })
    if (!ok) return
    setBusy(d.url)
    try {
      const r = await adminApi.restore(d.url)
      if (r.queued) track(`Restore: ${d.name}`, r.at, [d.url])
      setNotice({ tone: 'info', text: r.queued ? `Queued for re-ingest (${shortSha(r.sha)}). ${PUBLISH_NOTE}` : 'Already queued.' })
      void client.invalidateQueries({ queryKey: ['queue'] })
    } catch (e) {
      setNotice({ tone: 'error', text: errorText(e) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search removed games by name or URL"
        aria-label="Search removed games"
      />
      <p className="mt-2 text-xs text-muted-foreground">The {MAX_RESULTS} most recent removals that match.</p>
      <div className="mt-3">{notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}</div>
      <ul className="divide-y text-sm">
        {shown.map((d) => (
          <li key={d.url} className="flex items-start gap-3 py-2">
            <div className="min-w-0 flex-1">
              <span className="font-medium">{d.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {d.deleted_at.slice(0, 10)} · {d.reason}
              </span>
            </div>
            <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void restore(d)}>
              {busy === d.url ? 'Restoring…' : 'Restore'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Paste up to 100 game URLs (any text containing them), see which are in the catalog, remove them in one commit. */
function RemoveByList({ games, deleted }: { games: Game[]; deleted: { url: string }[] }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState<Picked[] | null>(null)
  const { removed } = useOverrides()
  const byUrl = useMemo(() => new Map(games.map((g) => [g.url, g])), [games])
  const gone = useMemo(() => new Set(deleted.map((d) => d.url)), [deleted])
  const { urls } = useMemo(() => extractGameUrls(text), [text])

  const inCatalog = urls.filter((u) => byUrl.has(u) && !removed.has(u))
  const alreadyRemoved = urls.filter((u) => gone.has(u) || removed.has(u))
  const unknown = urls.filter((u) => !byUrl.has(u) && !gone.has(u) && !removed.has(u))
  const picked: Picked[] = inCatalog.slice(0, MAX_BULK).map((u) => ({ url: u, name: byUrl.get(u)?.name ?? u }))

  return (
    <div className="max-w-3xl text-sm">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        spellCheck={false}
        placeholder="Game URLs to remove (any text containing them), up to 100 per removal"
        aria-label="Game URLs to remove"
        className="w-full rounded-md border bg-background p-2 font-mono text-sm"
      />
      {urls.length > 0 && (
        <div className="mt-2 space-y-1">
          <p>
            <span className="font-medium">{plural(inCatalog.length, 'game')} in the catalog</span>
            {alreadyRemoved.length > 0 && <span className="text-muted-foreground"> · {alreadyRemoved.length} already removed</span>}
            {unknown.length > 0 && <span className="text-muted-foreground"> · {unknown.length} not in the catalog</span>}
          </p>
          {inCatalog.length > MAX_BULK && (
            <p className="text-destructive">
              One removal takes {MAX_BULK} games: the first {MAX_BULK} go now, paste the rest afterwards.
            </p>
          )}
          <ul className="max-h-60 overflow-y-auto rounded-md border px-3 py-2 text-xs">
            {picked.map((g) => (
              <li key={g.url} className="truncate">
                <span className="font-medium">{g.name}</span> <span className="text-muted-foreground">{g.url.replace('https://', '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button className="mt-3" variant="destructive" disabled={picked.length === 0} onClick={() => setOpen(picked)}>
        Remove {plural(picked.length, 'game')}…
      </Button>
      {/* Removed games drop out of the list by themselves (this session remembers them). */}
      {open && <RemoveDialog games={open} onClose={() => setOpen(null)} onRemoved={() => {}} />}
    </div>
  )
}
