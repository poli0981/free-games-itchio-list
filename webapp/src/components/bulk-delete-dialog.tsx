import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { atomicCommit, bulkDeleteGames } from '@/lib/github/git-data'
import { useAllGames } from '@/hooks/useGames'
import { rebalance } from '@/lib/github/data-store'
import { PATHS } from '@/lib/config'
import type { Game } from '@/types/game'

interface BulkDeleteDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  selected: Game[]
  onComplete: () => void
}

const REASONS = ['Manual cleanup', 'Quality issue', 'Duplicate', 'Other']

export function BulkDeleteDialog({ open, onOpenChange, selected, onComplete }: BulkDeleteDialogProps) {
  const pat = useAuth((s) => s.pat)
  const all = useAllGames()
  const qc = useQueryClient()
  const pushUndo = useUndo((s) => s.push)
  const [reason, setReason] = useState(REASONS[0])
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const expected = `delete ${selected.length}`
  const canDelete = confirm.toLowerCase() === expected

  async function handleDelete() {
    if (!pat) return toast.error('Unlock your PAT in Settings.')
    if (!all.data) return toast.error('Game cache not ready.')
    if (!canDelete) return toast.error(`Type '${expected}' to confirm.`)
    setBusy(true)
    try {
      const octokit = createOctokit()
      const urls = selected.map((g) => g.url)
      const removedRecords = [...selected]
      const message = `chore(webapp): bulk-delete ${urls.length} games (${reason})`

      const { commitSha, touchedFiles } = await bulkDeleteGames(
        octokit,
        all.data.games,
        urls,
        reason,
        message,
      )

      pushUndo({
        id: commitSha,
        label: `Bulk-delete of ${urls.length} games`,
        timestamp: Date.now(),
        reverse: async () => {
          const { games } = (await qc.ensureQueryData({
            queryKey: ['db', 'all'],
          })) as { games: Game[] }
          const restored = [...games, ...removedRecords]
          const newChunks = rebalance(restored)
          const writes = newChunks.map((c) => ({
            path: PATHS.chunk(c.name),
            content: JSON.stringify(c.games, null, 4),
          }))
          await atomicCommit(
            createOctokit(),
            writes,
            `chore(webapp): undo delete ${commitSha.slice(0, 7)} (restore ${urls.length} games)`,
          )
          await qc.invalidateQueries({ queryKey: ['db'] })
        },
      })

      toast.success(
        `${urls.length} games deleted across ${touchedFiles.length} file(s) (${commitSha.slice(0, 7)}).`,
      )
      await qc.invalidateQueries({ queryKey: ['db'] })
      onComplete()
      onOpenChange(false)
      setConfirm('')
    } catch (e) {
      toast.error(`Delete failed: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {selected.length} games</DialogTitle>
          <DialogDescription>
            One atomic commit removes the records from data_game/ chunks (rebalanced) and appends
            entries to scripts/deleted_games.json. Use the undo button after committing to roll
            back. This is reversible only via undo or git revert.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 p-2 text-xs">
          <ul className="space-y-0.5">
            {selected.slice(0, 50).map((g) => (
              <li key={g.url} className="truncate">
                · {g.name} <span className="text-muted-foreground">({g.url})</span>
              </li>
            ))}
            {selected.length > 50 && (
              <li className="text-muted-foreground">… and {selected.length - 50} more</li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>
              Type <code className="font-mono">{expected}</code> to confirm
            </Label>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={expected}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={busy || !canDelete}>
            <Trash2 className="h-4 w-4" />
            {busy ? 'Deleting...' : `Delete ${selected.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
