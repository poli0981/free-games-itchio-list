import type { ReactNode } from 'react'
import { ExtLink } from '@/components/ext-link'
import {
  DensityChoice,
  LanguageChoice,
  ScrollbarsToggle,
  SlashShortcutToggle,
  SwitchRow,
  ThemeChoice,
} from '@/components/site/preference-controls'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ACCESSIBILITY_URLS } from '@/lib/about'
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
  const language = usePrefs((s) => s.language)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-6 pb-12 sm:px-8 md:pt-7">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{t('titles.settings')}</h1>

      <Section title={t('settings.appearance.title')} description={t('settings.appearance.desc')}>
        <ThemeChoice />
        <LanguageChoice />
        <DensityChoice />
        <ScrollbarsToggle id="hide-scrollbars" describe />
      </Section>

      <Section title={t('settings.a11y.title')} description={t('settings.a11y.desc')}>
        <SlashShortcutToggle id="slash-shortcut" />
        <p className="text-sm">
          <ExtLink href={ACCESSIBILITY_URLS[language]} className="font-medium underline underline-offset-4">
            {t('settings.a11y.statement')}
          </ExtLink>
        </p>
      </Section>

      <Section title={t('settings.content.title')}>
        <SwitchRow
          id="show-nsfw"
          label={t('settings.content.nsfw')}
          description={t('settings.content.nsfwDesc')}
          checked={showNsfw}
          onCheckedChange={(on) => (on ? requestNsfw() : setShowNsfw(false))}
        />
      </Section>
    </div>
  )
}
