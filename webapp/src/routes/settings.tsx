import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NOTIFICATION_DURATION_OPTIONS, usePrefs } from '@/stores/prefs'
import { useThemeStore, type Theme } from '@/stores/theme'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { switchLanguage, useT, type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const THEME_CHOICES: { value: Theme; labelKey: MessageKey; icon: typeof Sun }[] = [
  { value: 'light', labelKey: 'settings.theme.light', icon: Sun },
  { value: 'dark', labelKey: 'settings.theme.dark', icon: Moon },
  { value: 'system', labelKey: 'settings.theme.system', icon: Monitor },
]

// Local, per-device preferences only — the public app has no account or sign-in.
export default function Settings() {
  const t = useT()
  useDocumentTitle(t('titles.settings'))
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const prefs = usePrefs()

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{t('titles.settings')}</h1>

      <Card>
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
