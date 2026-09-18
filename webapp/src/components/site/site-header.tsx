import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Code2, Menu } from 'lucide-react'
import { ExtLink } from '@/components/ext-link'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useT, type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { DisplayMenu } from './display-menu'
import { GlobalSearch } from './global-search'

export const REPO_URL = 'https://github.com/poli0981/free-games-itchio-list'

const NAV: { to: string; key: MessageKey }[] = [
  { to: '/games', key: 'nav.games' },
  { to: '/charts', key: 'nav.charts' },
  { to: '/removed', key: 'nav.deleted' },
  { to: '/about', key: 'nav.about' },
]

const MENU: { to: string; key: MessageKey; end?: boolean }[] = [
  { to: '/', key: 'nav.home', end: true },
  ...NAV,
  { to: '/suggest', key: 'nav.suggest' },
  { to: '/settings', key: 'nav.settings' },
]

function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex size-[26px] items-center justify-center rounded-[7px] bg-primary', className)}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    </span>
  )
}

/** The current section's name, for the phone header. */
function usePageTitle(): MessageKey | null {
  const { pathname } = useLocation()
  const match = MENU.find((m) => (m.end ? pathname === m.to : pathname.startsWith(m.to)))
  return match && match.to !== '/' ? match.key : null
}

function MobileMenu() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    // Back/forward navigation doesn't go through the links' onClick.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [location.pathname])
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t('header.menu')}
        className="flex size-11 items-center justify-center rounded-lg text-foreground hover:bg-accent"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0 pt-[env(safe-area-inset-top)]">
        <SheetTitle className="sr-only">{t('header.nav')}</SheetTitle>
        <SheetDescription className="sr-only">{t('header.navDescription')}</SheetDescription>
        <nav aria-label={t('header.nav')} className="flex flex-col gap-1 p-4 pt-14">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center rounded-lg px-3 text-[15px]',
                  isActive ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent',
                )
              }
            >
              {t(m.key)}
            </NavLink>
          ))}
          <ExtLink href={REPO_URL} className="mt-4 flex min-h-11 items-center gap-2 px-3 text-sm text-muted-foreground">
            <Code2 className="size-4" aria-hidden="true" />
            {t('header.source')}
          </ExtLink>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export function SiteHeader() {
  const t = useT()
  const title = usePageTitle()
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/75">
      {/* Desktop */}
      <div className="mx-auto hidden h-14 max-w-[1440px] items-center gap-7 px-8 md:flex">
        <Link to="/" className="flex items-center gap-2.5" aria-label={t('header.home')}>
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight">Free Itch Games</span>
        </Link>
        <nav aria-label={t('header.nav')} className="flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-2.5 py-1.5 text-sm',
                  isActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="flex-1" />
        <GlobalSearch className="w-[300px]" />
        <DisplayMenu />
        <ExtLink
          href={REPO_URL}
          aria-label={t('header.source')}
          className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Code2 className="size-4" aria-hidden="true" />
        </ExtLink>
      </div>
      {/* Phone */}
      <div className="flex h-14 items-center gap-2.5 pr-2 pl-4 md:hidden">
        <Link to="/" aria-label={t('header.home')}>
          <BrandMark />
        </Link>
        <span className="flex-1 truncate text-[15px] font-semibold">{title ? t(title) : 'Free Itch Games'}</span>
        <DisplayMenu className="size-11 border-0" />
        <MobileMenu />
      </div>
    </header>
  )
}
