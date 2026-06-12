import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/stores/auth'
import { createOctokit } from '@/lib/github/client'
import { updateGameInChunk } from '@/lib/github/contents'
import { useAllGames } from '@/hooks/useGames'
import { useT } from '@/lib/i18n'
import type { Game } from '@/types/game'

interface EditGameFormProps {
  game: Game
  onCancel: () => void
  onSaved: () => void
}

const SAFE_OPTIONS = ['?', 'Yes', 'No', 'Caution'] as const
const NOTES_MAX = 500

export function EditGameForm({ game, onCancel, onSaved }: EditGameFormProps) {
  const t = useT()
  const pat = useAuth((s) => s.pat)
  const all = useAllGames()
  const qc = useQueryClient()
  const [safeVirus, setSafeVirus] = useState(game.safe_virus || '?')
  const [notes, setNotes] = useState(game.notes || '')
  const [nsfw, setNsfw] = useState(game.nsfw === 'Yes')
  const [busy, setBusy] = useState(false)

  const dirty =
    safeVirus !== (game.safe_virus || '?') ||
    notes !== (game.notes || '') ||
    nsfw !== (game.nsfw === 'Yes')

  const safeLabel = (o: string) =>
    o === 'Yes'
      ? t('common.yes')
      : o === 'No'
        ? t('common.no')
        : o === 'Caution'
          ? t('editForm.safe.caution')
          : o

  async function handleSave() {
    if (!pat) {
      toast.error(t('editForm.toast.unlockPat'))
      return
    }
    if (!all.data) {
      toast.error(t('editForm.toast.cacheNotLoaded'))
      return
    }
    if (notes.length > NOTES_MAX) {
      toast.error(t('editForm.toast.notesTooLong', { len: notes.length, max: NOTES_MAX }))
      return
    }
    setBusy(true)
    try {
      const octokit = createOctokit()
      const { chunkFile, commitSha } = await updateGameInChunk(
        octokit,
        all.data.games,
        game.url,
        {
          safe_virus: safeVirus,
          notes,
          nsfw: nsfw ? 'Yes' : 'No',
        },
        `chore(webapp): update annotations for ${game.name}`,
      )
      toast.success(t('editForm.toast.saved', { file: chunkFile, sha: commitSha.slice(0, 7) }))
      await qc.invalidateQueries({ queryKey: ['db'] })
      onSaved()
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('does not match') || msg.includes('409')) {
        toast.error(t('editForm.toast.conflict'))
      } else {
        toast.error(t('editForm.toast.saveFailed', { msg }))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('editForm.title')}</CardTitle>
        <p className="text-xs text-muted-foreground">{t('editForm.desc')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="safe-virus">{t('editForm.field.safeVirus')}</Label>
          <Select value={safeVirus} onValueChange={setSafeVirus}>
            <SelectTrigger id="safe-virus" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAFE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {safeLabel(opt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Switch id="nsfw" checked={nsfw} onCheckedChange={setNsfw} />
          <Label htmlFor="nsfw" className="cursor-pointer">
            {t('editForm.field.nsfw')}
          </Label>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="notes">{t('editForm.field.notes')}</Label>
            <span
              className={
                notes.length > NOTES_MAX
                  ? 'text-xs text-destructive'
                  : 'text-xs text-muted-foreground'
              }
            >
              {notes.length}/{NOTES_MAX}
            </span>
          </div>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={t('editForm.notesPlaceholder')}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} disabled={!dirty || busy || !pat}>
            <Save className="h-4 w-4" />
            {busy ? t('editForm.saving') : t('common.save')}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" />
            {t('common.cancel')}
          </Button>
          {!pat && (
            <span className="text-xs text-muted-foreground">{t('editForm.unlockHint')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
