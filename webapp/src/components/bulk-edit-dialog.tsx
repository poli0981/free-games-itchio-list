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
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  selected: Game[]
  onComplete: () => void
}

const SAFE_OPTIONS = ['?', 'Yes', 'No', 'Caution'] as const

export function BulkEditDialog({ open, onOpenChange, selected, onComplete }: BulkEditDialogProps) {
  const t = useT()
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

  const safeLabel = (o: string) =>
    o === 'Yes'
      ? t('common.yes')
      : o === 'No'
        ? t('common.no')
        : o === 'Caution'
          ? t('bulk.safe.caution')
          : o

  function buildPatch(): Partial<Pick<Game, 'safe_virus' | 'notes' | 'nsfw'>> {
    const p: Partial<Pick<Game, 'safe_virus' | 'notes' | 'nsfw'>> = {}
    if (editSafe) p.safe_virus = safeVal
    if (editNsfw) p.nsfw = nsfwVal ? 'Yes' : 'No'
    if (editNotes) p.notes = notesVal
    return p
  }

  async function handleApply() {
    if (!pat) return toast.error(t('bulk.toast.unlockPat'))
    if (!all.data) return toast.error(t('bulk.toast.cacheNotReady'))
    const patch = buildPatch()
    if (Object.keys(patch).length === 0) {
      return toast.error(t('bulk.toast.noField'))
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
        label: t('bulk.undo.editLabel', { n: selected.length }),
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
        t('bulk.toast.updated', {
          n: selected.length,
          files: touchedFiles.length,
          sha: commitSha.slice(0, 7),
        }),
      )
      await qc.invalidateQueries({ queryKey: ['db'] })
      onComplete()
      onOpenChange(false)
    } catch (e) {
      toast.error(t('bulk.toast.editFailed', { msg: (e as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('bulk.edit.title', { n: selected.length })}</DialogTitle>
          <DialogDescription>{t('bulk.edit.desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox checked={editSafe} onCheckedChange={(v) => setEditSafe(!!v)} className="mt-2" />
            <div className="flex-1 space-y-1.5">
              <Label>{t('bulk.field.safeVirus')}</Label>
              <Select value={safeVal} onValueChange={setSafeVal} disabled={!editSafe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAFE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {safeLabel(o)}
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
              <span className="text-sm text-muted-foreground">
                {nsfwVal ? t('common.yes') : t('common.no')}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox checked={editNotes} onCheckedChange={(v) => setEditNotes(!!v)} className="mt-2" />
            <div className="flex-1 space-y-1.5">
              <Label>{t('bulk.field.notesReplace')}</Label>
              <Textarea
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
                disabled={!editNotes}
                rows={3}
                placeholder={t('bulk.edit.notesPlaceholder')}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleApply} disabled={busy || !pat}>
            <Save className="h-4 w-4" />
            {busy ? t('bulk.edit.applying') : t('bulk.edit.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
