import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/stores/auth'
import { useUndo } from '@/stores/undo'
import { createOctokit } from '@/lib/github/client'
import { bulkUpdateGames, type BulkEditPatch } from '@/lib/github/git-data'
import { useAllGames } from '@/hooks/useGames'
import type { Game } from '@/types/game'

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  selected: Game[]
  onComplete: () => void
}

const SAFE_OPTIONS = ['?', 'Yes', 'No', 'Caution'] as const

export function BulkEditDialog({ open, onOpenChange, selected, onComplete }: BulkEditDialogProps) {
  const pat = useAuth((s) => s.pat)
  const all = useAllGames()
  const qc = useQueryClient()
  const pushUndo = useUndo((s) => s.push)
  const [editSafe, setEditSafe] = useState(false)
  const [safeVal, setSafeVal] = useState<string>('?')
  const [editNsfw, setEditNsfw] = useState(false)
  const [nsfwVal, setNsfwVal] = useState(false)
  const [editNotes, setEditNotes] = useState(false)
  const [notesVal, setNotesVal] = useState('')
  const [busy, setBusy] = useState(false)

  function buildPatch(): Partial<Pick<Game, 'safe_virus' | 'notes' | 'nsfw'>> {
    const p: Partial<Pick<Game, 'safe_virus' | 'notes' | 'nsfw'>> = {}
    if (editSafe) p.safe_virus = safeVal
    if (editNsfw) p.nsfw = nsfwVal ? 'Yes' : 'No'
    if (editNotes) p.notes = notesVal
    return p
  }

  async function handleApply() {
    if (!pat) return toast.error('Unlock your PAT in Settings.')
    if (!all.data) return toast.error('Game cache not ready.')
    const patch = buildPatch()
    if (Object.keys(patch).length === 0) {
      return toast.error('Toggle at least one field to update.')
    }
    setBusy(true)
    try {
      const octokit = createOctokit()
      const edits: BulkEditPatch[] = selected.map((g) => ({ url: g.url, patch }))
      const previous: BulkEditPatch[] = selected.map((g) => ({
        url: g.url,
        patch: {
          ...(editSafe ? { safe_virus: g.safe_virus ?? '?' } : {}),
          ...(editNsfw ? { nsfw: g.nsfw ?? 'No' } : {}),
          ...(editNotes ? { notes: g.notes ?? '' } : {}),
        },
      }))

      const message = `chore(webapp): bulk-update ${selected.length} games (${Object.keys(patch).join(', ')})`
      const { commitSha, touchedFiles } = await bulkUpdateGames(
        octokit,
        all.data.games,
        edits,
        message,
      )

      pushUndo({
        id: commitSha,
        label: `Bulk-edit of ${selected.length} games`,
        timestamp: Date.now(),
        reverse: async () => {
          const { games } = (await qc.ensureQueryData({
            queryKey: ['db', 'all'],
          })) as { games: Game[] }
          await bulkUpdateGames(
            createOctokit(),
            games,
            previous,
            `chore(webapp): undo bulk-edit ${commitSha.slice(0, 7)}`,
          )
          await qc.invalidateQueries({ queryKey: ['db'] })
        },
      })

      toast.success(
        `${selected.length} games updated in ${touchedFiles.length} file(s) (${commitSha.slice(0, 7)}).`,
      )
      await qc.invalidateQueries({ queryKey: ['db'] })
      onComplete()
      onOpenChange(false)
    } catch (e) {
      toast.error(`Bulk-edit failed: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Edit ({selected.length} games)</DialogTitle>
          <DialogDescription>
            Toggle a field on the left to apply the same value to every selected game. Untoggled
            fields stay as they are.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox checked={editSafe} onCheckedChange={(v) => setEditSafe(!!v)} className="mt-2" />
            <div className="flex-1 space-y-1.5">
              <Label>Safe / virus</Label>
              <Select value={safeVal} onValueChange={setSafeVal} disabled={!editSafe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAFE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox checked={editNsfw} onCheckedChange={(v) => setEditNsfw(!!v)} />
            <div className="flex flex-1 items-center gap-3">
              <Label>NSFW</Label>
              <Switch checked={nsfwVal} onCheckedChange={setNsfwVal} disabled={!editNsfw} />
              <span className="text-sm text-muted-foreground">{nsfwVal ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox checked={editNotes} onCheckedChange={(v) => setEditNotes(!!v)} className="mt-2" />
            <div className="flex-1 space-y-1.5">
              <Label>Notes (replaces existing)</Label>
              <Textarea
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
                disabled={!editNotes}
                rows={3}
                placeholder="Same notes for every selected game"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={busy || !pat}>
            <Save className="h-4 w-4" />
            {busy ? 'Applying...' : 'Apply to selected'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
