import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { KeyRound, Lock, Unlock, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useT } from '@/lib/i18n'
import { useAuth } from '@/stores/auth'
import { useGpg } from '@/stores/gpg'
import { usePrefs } from '@/stores/prefs'
import { decryptString, encryptString } from '@/lib/crypto'
import { readEncryptedGpg, writeEncryptedGpg } from '@/lib/gpg/storage'

function formatFingerprint(fp: string): string {
  // group every 4 chars
  return fp.replace(/(.{4})/g, '$1 ').trim()
}

export function GpgCard() {
  const t = useT()
  const pat = useAuth((s) => s.pat)
  const gpg = useGpg()
  const prefs = usePrefs()
  const fileRef = useRef<HTMLInputElement>(null)
  const [armoredInput, setArmoredInput] = useState('')
  const [gpgPassphrase, setGpgPassphrase] = useState('')
  const [webappPassphrase, setWebappPassphrase] = useState('')
  const [unlockPassphrase, setUnlockPassphrase] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setArmoredInput(text)
    e.target.value = ''
  }

  async function handleImport() {
    if (!armoredInput.trim()) {
      toast.error(t('gpg.toast.pasteKey'))
      return
    }
    if (webappPassphrase.length < 8) {
      toast.error(t('gpg.toast.confirmPassphrase'))
      return
    }
    setBusy(true)
    try {
      const { loadPrivateKey, armorPrivateKey } = await import('@/lib/gpg/sign')
      const { key, fingerprint, uid, emails } = await loadPrivateKey(
        armoredInput.trim(),
        gpgPassphrase || null,
      )
      // Persist the already-decrypted key wrapped in the webapp's AES-GCM (PAT passphrase).
      const decryptedArmored = await armorPrivateKey(key)
      const packed = await encryptString(decryptedArmored, webappPassphrase)
      writeEncryptedGpg(packed)
      gpg.setKey(key, fingerprint, uid, emails)
      gpg.setEnabled(true)
      // Auto-populate Commit author email with the primary UID so GitHub Verifies on first try.
      if (!prefs.authorEmail.trim() && emails[0]) {
        prefs.setAuthorEmail(emails[0])
      }
      setArmoredInput('')
      setGpgPassphrase('')
      setWebappPassphrase('')
      toast.success(t('gpg.toast.imported', { fingerprint: formatFingerprint(fingerprint) }))
    } catch (err) {
      toast.error(t('gpg.toast.importFailed', { message: (err as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  async function handleUnlock() {
    const packed = readEncryptedGpg()
    if (!packed) {
      toast.error(t('gpg.toast.noStoredKey'))
      return
    }
    if (!unlockPassphrase) {
      toast.error(t('gpg.toast.enterPassphrase'))
      return
    }
    setBusy(true)
    try {
      const decryptedArmored = await decryptString(packed, unlockPassphrase)
      const { loadPrivateKey } = await import('@/lib/gpg/sign')
      // Stored key is already PGP-decrypted; pass null passphrase.
      const { key, fingerprint, uid, emails } = await loadPrivateKey(decryptedArmored, null)
      gpg.setKey(key, fingerprint, uid, emails)
      setUnlockPassphrase('')
      toast.success(t('gpg.toast.unlocked', { fingerprint: formatFingerprint(fingerprint) }))
    } catch (err) {
      toast.error(t('gpg.toast.unlockFailed', { message: (err as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  function handleLock() {
    gpg.lock()
    toast.info(t('gpg.toast.locked'))
  }

  function handleRemove() {
    if (!confirm(t('gpg.confirm.remove')))
      return
    gpg.remove()
    toast.success(t('gpg.toast.removed'))
  }

  async function handleCopyPublic() {
    if (!gpg.privateKey) return
    try {
      const armored = gpg.privateKey.toPublic().armor()
      await navigator.clipboard.writeText(armored)
      toast.success(t('gpg.toast.publicCopied'))
    } catch (err) {
      toast.error(t('gpg.toast.copyFailed', { message: (err as Error).message }))
    }
  }

  async function handleTestSign() {
    if (!gpg.privateKey) return
    setBusy(true)
    try {
      const { buildCommitObject, currentTzOffsetMin } = await import(
        '@/lib/gpg/canonicalize'
      )
      const { signCommit, verifyDetached } = await import('@/lib/gpg/sign')
      const canonical = buildCommitObject({
        tree: '0'.repeat(40),
        parents: [],
        author: { name: 'webapp test', email: 'test@local' },
        committer: { name: 'webapp test', email: 'test@local' },
        ts: Math.floor(Date.now() / 1000),
        tzOffsetMin: currentTzOffsetMin(),
        message: 'webapp signing self-test',
      })
      const sig = await signCommit(gpg.privateKey, canonical)
      const pubArmored = gpg.privateKey.toPublic().armor()
      const ok = await verifyDetached(pubArmored, canonical, sig)
      toast[ok ? 'success' : 'error'](
        ok ? t('gpg.toast.testOk') : t('gpg.toast.testFail'),
      )
    } catch (err) {
      toast.error(t('gpg.toast.testError', { message: (err as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" />
          {t('gpg.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {t('gpg.desc.1')} <b>Verified</b> {t('gpg.desc.2')}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm">
            {t('gpg.status')}{' '}
            {gpg.privateKey ? (
              <Badge variant="default">
                <Unlock className="mr-1 h-3 w-3" /> {t('gpg.status.unlocked')}
              </Badge>
            ) : gpg.hasStoredGpg ? (
              <Badge variant="secondary">
                <Lock className="mr-1 h-3 w-3" /> {t('gpg.status.savedLocked')}
              </Badge>
            ) : (
              <Badge variant="outline">{t('gpg.status.noKey')}</Badge>
            )}
          </div>
          {gpg.fingerprint && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono text-[10px]">
                {formatFingerprint(gpg.fingerprint)}
              </Badge>
              {gpg.uid && <span className="truncate">{gpg.uid}</span>}
            </div>
          )}
        </div>

        {gpg.emails.length > 0 && (
          <EmailMatchInfo emails={gpg.emails} authorEmail={prefs.authorEmail} />
        )}

        {gpg.hasStoredGpg && (
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="gpg-enabled">{t('gpg.signCommits')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('gpg.signCommits.desc')}
              </p>
            </div>
            <Switch
              id="gpg-enabled"
              checked={gpg.enabled}
              onCheckedChange={gpg.setEnabled}
            />
          </div>
        )}

        <Separator />

        {gpg.privateKey ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleTestSign} disabled={busy} variant="outline" size="sm">
              <ShieldCheck className="h-4 w-4" />
              {t('gpg.testSign')}
            </Button>
            <Button onClick={handleCopyPublic} disabled={busy} variant="outline" size="sm">
              {t('gpg.copyPublic')}
            </Button>
            <Button onClick={handleLock} variant="outline" size="sm">
              <Lock className="h-4 w-4" />
              {t('gpg.lock')}
            </Button>
            <Button onClick={handleRemove} variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
              {t('gpg.removeKey')}
            </Button>
          </div>
        ) : gpg.hasStoredGpg ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="gpg-unlock-pass">{t('gpg.webappPassphrase')}</Label>
              <Input
                id="gpg-unlock-pass"
                type="password"
                value={unlockPassphrase}
                onChange={(e) => setUnlockPassphrase(e.target.value)}
                placeholder={t('gpg.unlockPlaceholder')}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleUnlock} disabled={busy}>
                <Unlock className="h-4 w-4" />
                {t('gpg.unlock')}
              </Button>
              <Button onClick={handleRemove} variant="ghost" size="sm">
                {t('gpg.removeKey')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!pat && (
              <p className="text-xs text-muted-foreground">
                {t('gpg.patFirst')}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="gpg-armored">{t('gpg.armoredKey')}</Label>
              <Textarea
                id="gpg-armored"
                rows={6}
                value={armoredInput}
                onChange={(e) => setArmoredInput(e.target.value)}
                placeholder="-----BEGIN PGP PRIVATE KEY BLOCK-----&#10;...&#10;-----END PGP PRIVATE KEY BLOCK-----"
                className="font-mono text-xs"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  type="button"
                >
                  {t('gpg.upload')}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".asc,.key,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <span className="text-xs text-muted-foreground">
                  {t('gpg.pasteFrom')} <code>gpg --export-secret-keys --armor &lt;key-id&gt;</code>
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gpg-pass">{t('gpg.keyPassphrase')}</Label>
              <Input
                id="gpg-pass"
                type="password"
                value={gpgPassphrase}
                onChange={(e) => setGpgPassphrase(e.target.value)}
                placeholder={t('gpg.keyPassphrasePlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gpg-wapp-pass">{t('gpg.webappPassphrase')}</Label>
              <Input
                id="gpg-wapp-pass"
                type="password"
                value={webappPassphrase}
                onChange={(e) => setWebappPassphrase(e.target.value)}
                placeholder={t('gpg.webappPassphrasePlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('gpg.webappPassphraseDesc')}
              </p>
            </div>
            <Button onClick={handleImport} disabled={busy}>
              <KeyRound className="h-4 w-4" />
              {t('gpg.importKey')}
            </Button>
          </div>
        )}

        <Separator />
        <p className="text-xs text-muted-foreground">
          {t('gpg.footer.1')}{' '}
          <a
            href="https://github.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            github.com/settings/keys
          </a>{' '}
          {t('gpg.footer.2')} <b>{t('gpg.copyPublic')}</b> {t('gpg.footer.3')}
        </p>
      </CardContent>
    </Card>
  )
}

function EmailMatchInfo({
  emails,
  authorEmail,
}: {
  emails: string[]
  authorEmail: string
}) {
  const t = useT()
  const trimmed = authorEmail.trim().toLowerCase()
  const matches = trimmed && emails.some((e) => e.toLowerCase() === trimmed)
  const noOverride = !trimmed
  return (
    <div className="space-y-1.5 rounded-md border bg-muted/30 p-3 text-xs">
      <div className="font-medium">{t('gpg.uids.title')}</div>
      <div className="flex flex-wrap gap-1">
        {emails.map((e) => (
          <Badge
            key={e}
            variant={trimmed && e.toLowerCase() === trimmed ? 'default' : 'outline'}
            className="font-mono text-[10px]"
          >
            {e}
          </Badge>
        ))}
      </div>
      {noOverride ? (
        <p className="text-muted-foreground">
          {t('gpg.uids.noOverride.1')} <b>{t('gpg.commitAuthor')}</b>{t('gpg.uids.noOverride.2')}
        </p>
      ) : matches ? (
        <p className="text-green-700 dark:text-green-500">
          ✓ <span className="font-mono">{authorEmail}</span> {t('gpg.uids.matches')}
        </p>
      ) : (
        <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-mono">{authorEmail}</span> {t('gpg.uids.mismatch.1')}{' '}
            <b>"could not be verified"</b> {t('gpg.uids.mismatch.2')}{' '}
            <b>{t('gpg.commitAuthor')}</b> {t('gpg.uids.mismatch.3')}
          </span>
        </p>
      )}
    </div>
  )
}
