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

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const Icon = ICONS[theme]

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
    setTheme(next)
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
