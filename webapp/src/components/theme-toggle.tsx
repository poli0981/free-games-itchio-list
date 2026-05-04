import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore, type Theme } from '@/stores/theme'
import { cn } from '@/lib/utils'

const ORDER: Theme[] = ['light', 'dark', 'system']
const ICONS: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}
const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const Icon = ICONS[theme]

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
        title={`Theme: ${LABELS[theme]} (click to cycle)`}
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
      title={`Theme: ${LABELS[theme]} (click to cycle)`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm">{LABELS[theme]}</span>
    </Button>
  )
}
