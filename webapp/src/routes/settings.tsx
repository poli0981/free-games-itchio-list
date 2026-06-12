import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, Unlock, Trash2, Check, X, Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  clearEncryptedPat,
  readEncryptedPat,
  useAuth,
  writeEncryptedPat,
} from '@/stores/auth'
import {
  IDLE_TIMEOUT_OPTIONS,
  NOTIFICATION_DURATION_OPTIONS,
  usePrefs,
} from '@/stores/prefs'
import { useThemeStore, type Theme } from '@/stores/theme'
import { decryptString, encryptString } from '@/lib/crypto'
import { checkRepoAccess, fetchAuthenticatedUser } from '@/lib/github/client'
import { REPO } from '@/lib/config'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { GpgCard } from '@/components/settings/gpg-card'
import { switchLanguage, useT, type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const THEME_CHOICES: { value: Theme; labelKey: MessageKey; icon: typeof Sun }[] = [
  { value: 'light', labelKey: 'settings.theme.light', icon: Sun },
  { value: 'dark', labelKey: 'settings.theme.dark', icon: Moon },
  { value: 'system', labelKey: 'settings.theme.system', icon: Monitor },
]

export default function Settings() {
  const t = useT()
  useDocumentTitle(t('titles.settings'))
  const { pat, user, hasStoredPat, setPat, setUser, lock, refreshStoredFlag } = useAuth()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const prefs = usePrefs()
  const [patInput, setPatInput] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [unlockPassphrase, setUnlockPassphrase] = useState('')
  const [busy, setBusy] = useState(false)
  const [repoOk, setRepoOk] = useState<boolean | null>(null)

  async function handleSavePat() {
    if (!patInput.trim()) {
      toast.error(t('settings.toast.pastePat'))
      return
    }
    if (passphrase.length < 8) {
      toast.error(t('settings.toast.passMin'))
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
      toast.success(t('settings.toast.savedUnlockedAs', { login: userInfo.login }))
    } catch (err) {
      toast.error(t('settings.toast.patInvalid', { message: (err as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  async function handleUnlock() {
    const packed = readEncryptedPat()
    if (!packed) {
      toast.error(t('settings.toast.noSavedPat'))
      return
    }
    if (!unlockPassphrase) {
      toast.error(t('settings.toast.enterPassphrase'))
      return
    }
    setBusy(true)
    try {
      const decrypted = await decryptString(packed, unlockPassphrase)
      const userInfo = await fetchAuthenticatedUser(decrypted)
      setPat(decrypted)
      setUser(userInfo)
      setUnlockPassphrase('')
      toast.success(t('settings.toast.unlockedAs', { login: userInfo.login }))
    } catch (err) {
      toast.error(t('settings.toast.unlockFailed', { message: (err as Error).message }))
    } finally {
      setBusy(false)
    }
  }

  function handleLock() {
    lock()
    setRepoOk(null)
    toast.info(t('settings.toast.locked'))
  }

  function handleRemove() {
    if (!confirm(t('settings.confirm.removePat'))) return
    clearEncryptedPat()
    lock()
    refreshStoredFlag()
    setRepoOk(null)
    toast.success(t('settings.toast.patRemoved'))
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
          ? t('settings.toast.repoOk', { repo: `${REPO.owner}/${REPO.name}` })
          : t('settings.toast.repoFail', { repo: `${REPO.owner}/${REPO.name}` }),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{t('titles.settings')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.auth.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('settings.auth.desc')}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm">
              {t('settings.auth.status')}{' '}
              {pat ? (
                <Badge variant="default">
                  <Unlock className="mr-1 h-3 w-3" /> {t('settings.auth.unlocked')}
                </Badge>
              ) : hasStoredPat ? (
                <Badge variant="secondary">
                  <Lock className="mr-1 h-3 w-3" /> {t('settings.auth.savedLocked')}
                </Badge>
              ) : (
                <Badge variant="outline">{t('settings.auth.noToken')}</Badge>
              )}
            </div>
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <img
                  src={user.avatar_url}
                  alt=""
                  width={24}
                  height={24}
                  loading="lazy"
                  decoding="async"
                  className="h-6 w-6 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <span>{user.login}</span>
              </div>
            )}
          </div>

          <Separator />

          {pat ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleTestRepo} disabled={busy} variant="outline" size="sm">
                  {t('settings.auth.testRepo')}
                  {repoOk === true && <Check className="h-4 w-4 text-green-600" />}
                  {repoOk === false && <X className="h-4 w-4 text-destructive" />}
                </Button>
                <Button onClick={handleLock} variant="outline" size="sm">
                  <Lock className="h-4 w-4" />
                  {t('settings.auth.lock')}
                </Button>
                <Button onClick={handleRemove} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                  {t('settings.auth.removeSaved')}
                </Button>
              </div>
            </div>
          ) : hasStoredPat ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="unlock-pass">{t('settings.auth.passphrase')}</Label>
                <Input
                  id="unlock-pass"
                  type="password"
                  value={unlockPassphrase}
                  onChange={(e) => setUnlockPassphrase(e.target.value)}
                  placeholder={t('settings.auth.passphrasePlaceholder')}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleUnlock} disabled={busy}>
                  <Unlock className="h-4 w-4" />
                  {t('settings.auth.unlock')}
                </Button>
                <Button onClick={handleRemove} variant="ghost" size="sm">
                  {t('settings.auth.forgetSaved')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pat">{t('settings.auth.patLabel')}</Label>
                <Input
                  id="pat"
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="github_pat_..."
                />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    {t('settings.auth.patScopePrefix')}{' '}
                    <span className="font-mono">
                      {REPO.owner}/{REPO.name}
                    </span>
                    {t('settings.auth.patScopeSuffix')}
                  </p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>
                      <span className="font-mono">Contents</span>: Read and write —{' '}
                      {t('settings.auth.permContents')}
                    </li>
                    <li>
                      <span className="font-mono">Actions</span>: Read and write —{' '}
                      {t('settings.auth.permActions')}
                    </li>
                  </ul>
                  <p className="pt-1">
                    {t('settings.auth.classicPrefix')}{' '}
                    <span className="font-mono">workflow</span>{' '}
                    {t('settings.auth.classicSuffix')}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pass">{t('settings.auth.passphrase')}</Label>
                <Input
                  id="pass"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder={t('settings.auth.passPlaceholder')}
                />
              </div>
              <Button onClick={handleSavePat} disabled={busy}>
                {t('settings.auth.saveUnlock')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.appearance.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('settings.appearance.desc')}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="language">{t('common.language')}</Label>
            <Select
              value={prefs.language}
              onValueChange={(v) => void switchLanguage(v as 'en' | 'vi')}
            >
              <SelectTrigger id="language" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('settings.appearance.theme')}</Label>
            <div className="flex flex-wrap gap-2">
              {THEME_CHOICES.map(({ value, labelKey, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className={cn('min-w-[88px]')}
                >
                  <Icon className="h-4 w-4" />
                  {t(labelKey)}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="density">{t('settings.appearance.density')}</Label>
            <Select
              value={prefs.density}
              onValueChange={(v) => prefs.setDensity(v as 'normal' | 'compact')}
            >
              <SelectTrigger id="density" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">{t('settings.density.normal')}</SelectItem>
                <SelectItem value="compact">{t('settings.density.compact')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="sidebar-collapsed">{t('settings.appearance.collapseSidebar')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.appearance.collapseSidebarDesc')}
              </p>
            </div>
            <Switch
              id="sidebar-collapsed"
              checked={prefs.sidebarCollapsed}
              onCheckedChange={prefs.setSidebarCollapsed}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.session.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('settings.session.desc')}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="idle">{t('settings.session.idleTimeout')}</Label>
            <Select
              value={String(prefs.idleTimeoutMs / 60_000)}
              onValueChange={(v) => prefs.setIdleTimeoutMs(Number(v) * 60_000)}
            >
              <SelectTrigger id="idle" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IDLE_TIMEOUT_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m < 60
                      ? t('settings.session.minutes', { m })
                      : m === 60
                        ? t('settings.session.hour')
                        : t('settings.session.hours', { h: m / 60 })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t('settings.session.idleNote')}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.author.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('settings.author.descPrefix')} <span className="font-mono">author</span>{' '}
            {t('settings.author.descAnd')} <span className="font-mono">committer</span>{' '}
            {t('settings.author.descSuffix')}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="author-name">{t('settings.author.name')}</Label>
            <Input
              id="author-name"
              value={prefs.authorName}
              onChange={(e) => prefs.setAuthorName(e.target.value)}
              placeholder={user?.name ?? user?.login ?? t('settings.author.namePlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="author-email">{t('settings.author.email')}</Label>
            <Input
              id="author-email"
              type="email"
              value={prefs.authorEmail}
              onChange={(e) => prefs.setAuthorEmail(e.target.value)}
              placeholder={user ? `${user.login}@users.noreply.github.com` : 'you@example.com'}
            />
            <p className="text-xs text-muted-foreground">
              {t('settings.author.verifiedPrefix')} <b>Verified</b>
              {t('settings.author.verifiedSuffix')}
            </p>
          </div>
        </CardContent>
      </Card>

      <GpgCard />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.notif.title')}</CardTitle>
          <p className="text-xs text-muted-foreground">{t('settings.notif.desc')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="notif-enabled">{t('settings.notif.enable')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.notif.enableDesc')}</p>
            </div>
            <Switch
              id="notif-enabled"
              checked={prefs.notificationsEnabled}
              onCheckedChange={prefs.setNotificationsEnabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-duration">{t('settings.notif.duration')}</Label>
            <Select
              value={String(prefs.notificationDurationMs)}
              onValueChange={(v) => prefs.setNotificationDurationMs(Number(v))}
            >
              <SelectTrigger id="notif-duration" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_DURATION_OPTIONS.map((ms) => (
                  <SelectItem key={ms} value={String(ms)}>
                    {ms / 1000}s
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
