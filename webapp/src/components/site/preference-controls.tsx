import { Monitor, Moon, Sun } from 'lucide-react'
import { switchLanguage, useT, type Language, type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { usePrefs } from '@/stores/prefs'
import { useThemeStore, type Theme } from '@/stores/theme'

const THEMES: { value: Theme; key: MessageKey; icon: typeof Sun }[] = [
  { value: 'light', key: 'theme.light', icon: Sun },
  { value: 'dark', key: 'theme.dark', icon: Moon },
  { value: 'system', key: 'theme.system', icon: Monitor },
]

/** A small single-choice button row. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; icon?: typeof Sun }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex h-8 items-center justify-center gap-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground',
              value === o.value && 'bg-card font-medium text-foreground shadow-xs',
            )}
          >
            {o.icon && <o.icon className="size-3.5" aria-hidden="true" />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ThemeChoice() {
  const t = useT()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  return (
    <Segmented
      label={t('settings.appearance.theme')}
      value={theme}
      onChange={setTheme}
      options={THEMES.map((o) => ({ value: o.value, label: t(o.key), icon: o.icon }))}
    />
  )
}

export function LanguageChoice() {
  const t = useT()
  const language = usePrefs((s) => s.language)
  return (
    <Segmented<Language>
      label={t('common.language')}
      value={language}
      onChange={(l) => void switchLanguage(l)}
      options={[
        { value: 'en', label: 'English' },
        { value: 'vi', label: 'Tiếng Việt' },
      ]}
    />
  )
}

export function DensityChoice() {
  const t = useT()
  const density = usePrefs((s) => s.density)
  const setDensity = usePrefs((s) => s.setDensity)
  return (
    <Segmented
      label={t('settings.appearance.density')}
      value={density}
      onChange={setDensity}
      options={[
        { value: 'normal', label: t('display.density.normal') },
        { value: 'compact', label: t('display.density.compact') },
      ]}
    />
  )
}
