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
import type { Game } from '@/types/game'

interface EditGameFormProps {
  game: Game
  onCancel: () => void
  onSaved: () => void
}

const SAFE_OPTIONS = ['?', 'Yes', 'No', 'Caution'] as const
const NOTES_MAX = 500

export function EditGameForm({ game, onCancel, onSaved }: EditGameFormProps) {
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

  async function handleSave() {
    if (!pat) {
      toast.error('Unlock your PAT in Settings first.')
      return
    }
    if (!all.data) {
      toast.error('Game cache not loaded yet.')
      return
    }
    if (notes.length > NOTES_MAX) {
      toast.error(`Notes too long (${notes.length}/${NOTES_MAX}).`)
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
      toast.success(`Saved to ${chunkFile} (${commitSha.slice(0, 7)})`)
      await qc.invalidateQueries({ queryKey: ['db'] })
      onSaved()
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('does not match') || msg.includes('409')) {
        toast.error('Conflict: file changed on the remote. Refresh and re-edit.')
      } else {
        toast.error(`Save failed: ${msg}`)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Annotations</CardTitle>
        <p className="text-xs text-muted-foreground">
          Three user-editable fields. Everything else is auto-fetched and read-only.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="safe-virus">Safe / virus</Label>
          <Select value={safeVirus} onValueChange={setSafeVirus}>
            <SelectTrigger id="safe-virus" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAFE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Switch id="nsfw" checked={nsfw} onCheckedChange={setNsfw} />
          <Label htmlFor="nsfw" className="cursor-pointer">
            NSFW (override auto-detection)
          </Label>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="notes">Notes</Label>
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
            placeholder="Free-form notes (markdown allowed)"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} disabled={!dirty || busy || !pat}>
            <Save className="h-4 w-4" />
            {busy ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
          {!pat && (
            <span className="text-xs text-muted-foreground">
              Unlock your PAT in Settings to enable Save.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
