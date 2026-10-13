/** The bulk actions on selected catalog games: remove (with a public reason) and edit. */
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { REMOVAL_REASONS } from '@/lib/deleted-reason'
import { MAX_REASON } from '../worker/limits'
import { adminApi, shortSha, type GameEdit } from './api'
import { rememberEdits, rememberRemoved } from './overrides'
import { PUBLISH_NOTE, WARNING_TEXT, errorText, plural } from './texts'
import { Notice, type NoticeState } from './ui'

export interface Picked {
  url: string
  name: string
}

function GameList({ games }: { games: Picked[] }) {
  return (
    <ul className="max-h-40 overflow-y-auto rounded-md border px-3 py-2 text-xs">
      {games.map((g) => (
        <li key={g.url} className="truncate">
          <span className="font-medium">{g.name}</span> <span className="text-muted-foreground">{g.url.replace('https://', '')}</span>
        </li>
      ))}
    </ul>
  )
}

const OTHER = 'other'

/**
 * Remove up to 100 games in one commit. The reason is public (the Removed page
 * shows it, translated for the standard ones) and the games stay blocked from
 * re-ingest until restored.
 */
export function RemoveDialog({
  games,
  onClose,
  onRemoved,
}: {
  /** The games as they were when the dialog opened (mount it with a fresh list each time). */
  games: Picked[]
  onClose: () => void
  onRemoved: (urls: string[]) => void
}) {
  const [preset, setPreset] = useState<string>(REMOVAL_REASONS[0])
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const reason = (preset === OTHER ? custom : preset).trim()

  const remove = async () => {
    setBusy(true)
    setNotice(null)
    try {
      const r = await adminApi.removeMany(
        games.map((g) => g.url),
        reason,
      )
      rememberRemoved(r.removed)
      onRemoved(r.removed)
      const lines = [
        r.removed.length > 0
          ? `Removed ${plural(r.removed.length, 'game')} (${shortSha(r.sha)}). ${PUBLISH_NOTE}`
          : 'Nothing was removed.',
        r.notFound.length > 0 ? `Not in the catalog any more: ${plural(r.notFound.length, 'game')}.` : '',
        ...r.warnings.map((w) => `Note: ${WARNING_TEXT[w] ?? w}.`),
      ]
      setNotice({ tone: 'info', text: lines.filter(Boolean).join('\n') })
    } catch (e) {
      setNotice({ tone: 'error', text: errorText(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent>
        <div className="space-y-1 pr-6">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Remove {plural(games.length, 'game')} from the catalog
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            One commit. The reason is public (Removed page); the games stay blocked from every source until restored.
          </DialogDescription>
        </div>
        <GameList games={games} />
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Reason</span>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="h-9 rounded-md border bg-background px-2">
            {REMOVAL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value={OTHER}>Other…</option>
          </select>
        </label>
        {preset === OTHER && (
          <Input
            value={custom}
            maxLength={MAX_REASON}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Reason (public)"
            aria-label="Removal reason"
            autoFocus
          />
        )}
        {notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            {notice?.tone === 'info' ? 'Close' : 'Cancel'}
          </Button>
          {notice?.tone !== 'info' && (
            <Button variant="destructive" disabled={busy || !reason || games.length === 0} onClick={() => void remove()}>
              {busy ? 'Removing…' : `Remove ${plural(games.length, 'game')}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const KEEP = 'keep'

/** Set the 18+ flag, the virus check and/or the notes of up to 100 games in one commit. */
export function BulkEditDialog({ games, onClose }: { games: Picked[]; onClose: () => void }) {
  const [nsfw, setNsfw] = useState(KEEP)
  const [virus, setVirus] = useState(KEEP)
  const [notesMode, setNotesMode] = useState<'keep' | 'replace' | 'clear'>('keep')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)

  const edit: GameEdit = {
    ...(nsfw !== KEEP ? { nsfw } : {}),
    ...(virus !== KEEP ? { safe_virus: virus } : {}),
    ...(notesMode === 'replace' ? { notes } : notesMode === 'clear' ? { notes: '' } : {}),
  }
  const empty = Object.keys(edit).length === 0

  const save = async () => {
    setBusy(true)
    setNotice(null)
    try {
      const edits = games.map((g) => ({ url: g.url, edit }))
      const r = await adminApi.editMany(edits)
      rememberEdits(edits.filter((e) => !r.notFound.includes(e.url)))
      const lines = [
        r.edited.length > 0 ? `Saved ${plural(r.edited.length, 'game')} (${shortSha(r.sha)}). ${PUBLISH_NOTE}` : 'Nothing changed.',
        r.unchanged.length > 0 ? `Already so: ${plural(r.unchanged.length, 'game')}.` : '',
        r.notFound.length > 0 ? `Not in the catalog any more: ${plural(r.notFound.length, 'game')}.` : '',
      ]
      setNotice({ tone: 'info', text: lines.filter(Boolean).join('\n') })
    } catch (e) {
      setNotice({ tone: 'error', text: errorText(e) })
    } finally {
      setBusy(false)
    }
  }

  const select = (label: string, value: string, onChange: (v: string) => void, options: [string, string][]) => (
    <label className="grid gap-1 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-md border bg-background px-2">
        <option value={KEEP}>Keep as it is</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <Dialog open onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent>
        <div className="space-y-1 pr-6">
          <DialogTitle className="text-lg font-semibold tracking-tight">Edit {plural(games.length, 'game')}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            One commit. Only the fields you change are written.
          </DialogDescription>
        </div>
        <GameList games={games} />
        <div className="grid gap-3 sm:grid-cols-2">
          {select('NSFW (18+)', nsfw, setNsfw, [
            ['No', 'No'],
            ['Yes', 'Yes'],
          ])}
          {select('Virus check', virus, setVirus, [
            ['?', 'Not checked (?)'],
            ['Yes', 'Yes'],
            ['No', 'No'],
            ['Caution', 'Caution'],
          ])}
        </div>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Notes (public)</span>
          <select
            value={notesMode}
            onChange={(e) => setNotesMode(e.target.value as typeof notesMode)}
            className="h-9 rounded-md border bg-background px-2"
          >
            <option value="keep">Keep as they are</option>
            <option value="replace">Replace with…</option>
            <option value="clear">Clear</option>
          </select>
        </label>
        {notesMode === 'replace' && (
          <textarea
            value={notes}
            maxLength={2000}
            rows={3}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="New notes"
            className="rounded-md border bg-background p-2 text-sm"
          />
        )}
        {notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            {notice?.tone === 'info' ? 'Close' : 'Cancel'}
          </Button>
          {notice?.tone !== 'info' && (
            <Button disabled={busy || empty || games.length === 0} onClick={() => void save()}>
              {busy ? 'Saving…' : `Save ${plural(games.length, 'game')}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
