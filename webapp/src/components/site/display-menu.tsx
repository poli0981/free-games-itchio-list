import { Link } from 'react-router'
import { SunMoon } from 'lucide-react'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { useT } from '@/lib/i18n'
import { requestNsfw } from '@/lib/nsfw'
import { cn } from '@/lib/utils'
import { usePrefs } from '@/stores/prefs'
import { DensityChoice, LanguageChoice, ThemeChoice } from './preference-controls'

/** Theme, language, density and 18+ — the settings people change often. */
export function DisplayMenu({ className }: { className?: string }) {
  const t = useT()
  const showNsfw = usePrefs((s) => s.showNsfw)
  const setShowNsfw = usePrefs((s) => s.setShowNsfw)

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t('header.display')}
        className={cn(
          'flex size-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-accent hover:text-foreground',
          className,
        )}
      >
        <SunMoon className="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={t('header.display')} className="w-72 space-y-4">
        <ThemeChoice />
        <LanguageChoice />
        <DensityChoice />
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="menu-nsfw" className="text-sm">
            {t('settings.content.nsfw')}
          </label>
          <Switch
            id="menu-nsfw"
            checked={showNsfw}
            onCheckedChange={(on) => (on ? requestNsfw() : setShowNsfw(false))}
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
