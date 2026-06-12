import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore, type Theme } from '@/stores/theme'
import { cn } from '@/lib/utils'
import { useT, type MessageKey } from '@/lib/i18n'

const ORDER: Theme[] = ['light', 'dark', 'system']
const ICONS: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}
const LABEL_KEYS: Record<Theme, MessageKey> = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
}

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const t = useT()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const Icon = ICONS[theme]
  const label = t(LABEL_KEYS[theme])

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
    setTheme(next)
  }

  if (!showLabel) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={cycle}
        className={cn('h-8 w-8', className)}
        title={t('theme.toggleTitle', { label })}
      >
        <Icon className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycle}
      className={cn('w-full justify-start gap-3', className)}
      title={t('theme.toggleTitle', { label })}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </Button>
  )
}
