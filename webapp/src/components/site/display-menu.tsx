import { useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { useT } from '@/lib/i18n'
import { requestNsfw } from '@/lib/nsfw'
import { cn } from '@/lib/utils'
import { usePrefs } from '@/stores/prefs'
import { useThemeStore } from '@/stores/theme'
import { THEME_ICON } from '@/components/theme-icon'
import { DensityChoice, LanguageChoice, ScrollbarsToggle, ThemeChoice } from './preference-controls'

/** Theme, language, density, scrollbars and 18+ — the settings people change often. */
export function DisplayMenu({ className }: { className?: string }) {
  const t = useT()
  const { pathname } = useLocation()
  const openedOn = useRef(pathname)
  const trigger = useRef<HTMLButtonElement>(null)
  const showNsfw = usePrefs((s) => s.showNsfw)
  const setShowNsfw = usePrefs((s) => s.setShowNsfw)
  // The button shows the theme in use: light, dark or following the system.
  const ThemeIcon = THEME_ICON[useThemeStore((s) => s.theme)]

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) openedOn.current = pathname
      }}
    >
      <PopoverTrigger
        ref={trigger}
        aria-label={t('header.display')}
        className={cn(
          'flex size-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-accent hover:text-foreground',
          className,
        )}
      >
        <ThemeIcon className="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label={t('header.display')}
        // "All settings" opened another page: focus belongs to its heading, not back on this button.
        onCloseAutoFocus={(e) => {
          if (pathname !== openedOn.current) e.preventDefault()
        }}
        className="max-h-[var(--radix-popover-content-available-height)] w-72 space-y-4 overflow-y-auto"
      >
        <ThemeChoice />
        <LanguageChoice />
        <DensityChoice />
        <ScrollbarsToggle id="menu-scrollbars" />
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="menu-nsfw" className="text-sm">
            {t('settings.content.nsfw')}
          </label>
          <Switch
            id="menu-nsfw"
            checked={showNsfw}
            // The menu closes when the dialog opens: focus returns to its button afterwards.
            onCheckedChange={(on) => (on ? requestNsfw(trigger.current) : setShowNsfw(false))}
          />
        </div>
        <PopoverClose asChild>
          <Link to="/settings" className="block text-xs text-muted-foreground underline-offset-4 hover:underline">
            {t('display.allSettings')}
          </Link>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  )
}
