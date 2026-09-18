import type { ReactNode } from 'react'
import { Switch } from '@/components/ui/switch'
import { DensityChoice, LanguageChoice, ThemeChoice } from '@/components/site/preference-controls'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { requestNsfw } from '@/lib/nsfw'
import { useT } from '@/lib/i18n'
import { usePrefs } from '@/stores/prefs'

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border bg-card p-5" data-card-pad>
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

// Local, per-device preferences only — the public app has no account or sign-in.
export default function Settings() {
  const t = useT()
  useDocumentTitle(t('titles.settings'))
  const showNsfw = usePrefs((s) => s.showNsfw)
  const setShowNsfw = usePrefs((s) => s.setShowNsfw)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-6 pb-12 sm:px-8 md:pt-7">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{t('titles.settings')}</h1>

      <Section title={t('settings.appearance.title')} description={t('settings.appearance.desc')}>
        <ThemeChoice />
        <LanguageChoice />
        <DensityChoice />
      </Section>

      <Section title={t('settings.content.title')}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label htmlFor="show-nsfw" className="text-sm font-medium">
              {t('settings.content.nsfw')}
            </label>
            <p className="text-sm text-muted-foreground">{t('settings.content.nsfwDesc')}</p>
          </div>
          <Switch
            id="show-nsfw"
            checked={showNsfw}
            onCheckedChange={(on) => (on ? requestNsfw() : setShowNsfw(false))}
          />
        </div>
      </Section>
    </div>
  )
}
