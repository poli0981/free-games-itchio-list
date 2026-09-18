import { Link } from 'react-router'
import { ExtLink } from '@/components/ext-link'
import { useT, type MessageKey } from '@/lib/i18n'
import { isAndroid, isTauri } from '@/lib/runtime'
import { REPO_URL } from './site-header'

const DOCS = `${REPO_URL}/blob/main`

const LINKS: { key: MessageKey; href: string }[] = [
  { key: 'footer.terms', href: `${DOCS}/docs/ToS.md` },
  { key: 'footer.privacy', href: `${DOCS}/docs/PrivacyPolicy.md` },
  { key: 'footer.licenses', href: `${DOCS}/NOTICE.md` },
  { key: 'footer.removal', href: `${DOCS}/docs/ToS.md#7-content-removal-and-copyright` },
  { key: 'footer.data', href: `${DOCS}/data_game/LICENSE.md` },
]

export function SiteFooter() {
  const t = useT()
  return (
    <footer className="border-t pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-5 text-[13px] text-muted-foreground sm:px-8 lg:flex-row lg:items-center lg:gap-6">
        <p className="flex-1">
          {t('footer.notAffiliated')}
          {isTauri() && (
            <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-xs">
              {t(isAndroid() ? 'footer.mobileApp' : 'footer.desktopApp')}
            </span>
          )}
        </p>
        <nav aria-label={t('footer.label')} className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <ExtLink key={l.key} href={l.href} className="hover:text-foreground">
              {t(l.key)}
            </ExtLink>
          ))}
          <Link to="/about#support" className="hover:text-foreground">
            {t('footer.support')}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
