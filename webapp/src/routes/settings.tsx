import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, Unlock, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  clearEncryptedPat,
  readEncryptedPat,
  useAuth,
  writeEncryptedPat,
} from '@/stores/auth'
import { decryptString, encryptString } from '@/lib/crypto'
import { checkRepoAccess, fetchAuthenticatedUser } from '@/lib/github/client'
import { REPO } from '@/lib/config'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function Settings() {
  useDocumentTitle('Settings')
  const { pat, user, hasStoredPat, setPat, setUser, lock, refreshStoredFlag } = useAuth()
  const [patInput, setPatInput] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [unlockPassphrase, setUnlockPassphrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [repoOk, setRepoOk] = useState<boolean | null>(null)

  async function handleSavePat() {
    if (!patInput.trim()) {
      toast.error('Paste a Personal Access Token first.')
      return
    }
    if (passphrase.length < 8) {
      toast.error('Passphrase must be at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      const userInfo = await fetchAuthenticatedUser(patInput.trim())
      const packed = await encryptString(patInput.trim(), passphrase)
      writeEncryptedPat(packed)
      setPat(patInput.trim())
      setUser(userInfo)
      refreshStoredFlag()
      setPatInput('')
      setPassphrase('')
      toast.success(`Saved & unlocked as ${userInfo.login}`)
    } catch (err) {
      toast.error(`Could not validate PAT: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleUnlock() {
    const packed = readEncryptedPat()
    if (!packed) {
      toast.error('No saved PAT found.')
      return
    }
    if (!unlockPassphrase) {
      toast.error('Enter your passphrase.')
      return
    }
    setBusy(true)
    try {
      const decrypted = await decryptString(packed, unlockPassphrase)
      const userInfo = await fetchAuthenticatedUser(decrypted)
      setPat(decrypted)
      setUser(userInfo)
      setUnlockPassphrase('')
      toast.success(`Unlocked as ${userInfo.login}`)
    } catch (err) {
      toast.error(`Unlock failed: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  function handleLock() {
    lock()
    setRepoOk(null)
    toast.info('Locked. Enter your passphrase to unlock again.')
  }

  function handleRemove() {
    if (!confirm('Remove the encrypted PAT from this browser? You will need to paste it again.'))
      return
    clearEncryptedPat()
    lock()
    refreshStoredFlag()
    setRepoOk(null)
    toast.success('Encrypted PAT removed from localStorage.')
  }

  async function handleTestRepo() {
    if (!pat) return
    setBusy(true)
    setRepoOk(null)
    try {
      const ok = await checkRepoAccess(pat)
      setRepoOk(ok)
      toast[ok ? 'success' : 'error'](
        ok
          ? `Can access ${REPO.owner}/${REPO.name}`
          : `No access to ${REPO.owner}/${REPO.name}. Check token scopes.`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">GitHub Authentication</CardTitle>
          <p className="text-xs text-muted-foreground">
            Your PAT is encrypted with AES-GCM (PBKDF2-SHA256, 100k iterations) using your
            passphrase before being stored in localStorage. The decrypted token only lives in
            memory while the tab is open.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm">
              Status:{' '}
              {pat ? (
                <Badge variant="default">
                  <Unlock className="mr-1 h-3 w-3" /> Unlocked
                </Badge>
              ) : hasStoredPat ? (
                <Badge variant="secondary">
                  <Lock className="mr-1 h-3 w-3" /> Saved (locked)
                </Badge>
              ) : (
                <Badge variant="outline">No token saved</Badge>
              )}
            </div>
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                <span>{user.login}</span>
              </div>
            )}
          </div>

          <Separator />

          {pat ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleTestRepo} disabled={busy} variant="outline" size="sm">
                  Test repo access
                  {repoOk === true && <Check className="h-4 w-4 text-green-600" />}
                  {repoOk === false && <X className="h-4 w-4 text-destructive" />}
                </Button>
                <Button onClick={handleLock} variant="outline" size="sm">
                  <Lock className="h-4 w-4" />
                  Lock
                </Button>
                <Button onClick={handleRemove} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                  Remove saved PAT
                </Button>
              </div>
            </div>
          ) : hasStoredPat ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="unlock-pass">Passphrase</Label>
                <Input
                  id="unlock-pass"
                  type="password"
                  value={unlockPassphrase}
                  onChange={(e) => setUnlockPassphrase(e.target.value)}
                  placeholder="Your passphrase"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleUnlock} disabled={busy}>
                  <Unlock className="h-4 w-4" />
                  Unlock
                </Button>
                <Button onClick={handleRemove} variant="ghost" size="sm">
                  Forget saved PAT
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pat">Personal Access Token</Label>
                <Input
                  id="pat"
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="github_pat_..."
                />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    Fine-grained token scoped to only{' '}
                    <span className="font-mono">
                      {REPO.owner}/{REPO.name}
                    </span>
                    , with these repository permissions:
                  </p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>
                      <span className="font-mono">Contents</span>: Read and write — required for
                      edits, deletes, and queueing URLs.
                    </li>
                    <li>
                      <span className="font-mono">Actions</span>: Read and write — required to
                      dispatch the scraper workflow from Add / Workflows.
                    </li>
                  </ul>
                  <p className="pt-1">
                    Classic tokens with the <span className="font-mono">workflow</span> scope also
                    work but grant access to every repo you can write to.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pass">Passphrase</Label>
                <Input
                  id="pass"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Min 8 chars; required to unlock later"
                />
              </div>
              <Button onClick={handleSavePat} disabled={busy}>
                Save & unlock
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <p className="text-xs text-muted-foreground">
            Toggle in the sidebar bottom-left. The choice persists in localStorage and follows
            your OS in System mode.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            More appearance options come in Phase 6 polish.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
