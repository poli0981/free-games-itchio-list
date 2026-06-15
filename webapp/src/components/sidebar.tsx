import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Gamepad2,
  Plus,
  BarChart3,
  Workflow,
  Trash2,
  Settings,
  Info,
  Library,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Heart,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExtLink } from '@/components/ext-link'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { SyncButton } from '@/components/sync-button'
import { useAuth } from '@/stores/auth'
import { usePrefs } from '@/stores/prefs'
import { isTauri } from '@/lib/runtime'
import { useIsMobile } from '@/lib/use-is-mobile'
import { useT, type MessageKey } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: MessageKey
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/games', label: 'nav.games', icon: Gamepad2 },
  { to: '/add', label: 'nav.addGame', icon: Plus },
  { to: '/charts', label: 'nav.charts', icon: BarChart3 },
  { to: '/workflows', label: 'nav.workflows', icon: Workflow },
  { to: '/deleted', label: 'nav.deleted', icon: Trash2 },
  { to: '/settings', label: 'nav.settings', icon: Settings },
  { to: '/about', label: 'nav.about', icon: Info },
]

interface SidebarBodyProps {
  collapsed?: boolean
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
  onToggleCollapsed?: () => void
}

function SidebarHeader({
  collapsed,
  variant,
  onToggleCollapsed,
}: Pick<SidebarBodyProps, 'collapsed' | 'variant' | 'onToggleCollapsed'>) {
  const t = useT()
  const user = useAuth((s) => s.user)
  const hasStoredPat = useAuth((s) => s.hasStoredPat)
  return (
    <div
      className={cn(
        'flex h-14 items-center border-b',
        collapsed && variant === 'desktop' ? 'justify-center px-2' : 'gap-2 px-3',
      )}
    >
      {(!collapsed || variant === 'mobile') && (
        <>
          <Library className="h-5 w-5" />
          <span className="font-semibold">Itch.io DB</span>
          <div className="ml-auto flex items-center gap-1.5">
            <SyncButton />
            {user ? (
              <img
                src={user.avatar_url}
                alt={user.login}
                title={t('sidebar.signedInAs', { login: user.login })}
                width={24}
                height={24}
                loading="lazy"
                decoding="async"
                className="h-6 w-6 rounded-full"
              />
            ) : hasStoredPat ? (
              <span title={t('sidebar.patLocked')} className="h-2 w-2 rounded-full bg-yellow-500" />
            ) : (
              <span title={t('sidebar.noPat')} className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            )}
          </div>
        </>
      )}
      {variant === 'desktop' && onToggleCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapsed}
          className={cn('h-8 w-8', !collapsed && 'ml-1')}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      )}
    </div>
  )
}

function SidebarNav({ collapsed, variant, onNavigate }: SidebarBodyProps) {
  const t = useT()
  const isCompact = variant === 'desktop' && collapsed
  return (
    <nav className={cn('flex flex-1 flex-col gap-1 p-2', !isCompact && 'p-3')}>
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={isCompact ? t(label) : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-md text-sm transition-colors',
              isCompact ? 'h-10 w-10 justify-center' : 'gap-3 px-3 py-2 min-h-[2.75rem] md:min-h-0',
              isActive
                ? 'bg-secondary text-secondary-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          <Icon className="h-4 w-4" />
          {!isCompact && t(label)}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarFooter({ collapsed, variant, onNavigate }: SidebarBodyProps) {
  const t = useT()
  const user = useAuth((s) => s.user)
  const hasStoredPat = useAuth((s) => s.hasStoredPat)
  const isMobile = useIsMobile()
  const isCompact = variant === 'desktop' && collapsed
  return (
    <div
      className={cn(
        'space-y-2 border-t',
        isCompact ? 'flex flex-col items-center gap-2 p-2 space-y-0' : 'p-3',
      )}
    >
      {isTauri() && !isCompact && (
        <div className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
          {t(isMobile ? 'sidebar.mobileApp' : 'sidebar.desktopApp')}
        </div>
      )}
      {isCompact ? (
        <>
          <SyncButton />
          <ThemeToggle showLabel={false} />
          <NavLink
            to="/about#support"
            onClick={onNavigate}
            title={t('sidebar.support')}
            aria-label={t('sidebar.support')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Heart className="h-4 w-4" />
          </NavLink>
          {user ? (
            <img
              src={user.avatar_url}
              alt={user.login}
              title={t('sidebar.signedInAs', { login: user.login })}
              width={24}
              height={24}
              loading="lazy"
              decoding="async"
              className="h-6 w-6 rounded-full"
            />
          ) : hasStoredPat ? (
            <span title={t('sidebar.patLocked')} className="h-2 w-2 rounded-full bg-yellow-500" />
          ) : (
            <span title={t('sidebar.noPat')} className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          )}
        </>
      ) : (
        <>
          <ThemeToggle />
          <NavLink
            to="/about#support"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Heart className="h-3.5 w-3.5" />
            {t('sidebar.support')}
          </NavLink>
          <ExtLink
            href="https://github.com/poli0981/free-games-itchio-list"
            className="block text-xs text-muted-foreground hover:underline"
          >
            poli0981/free-games-itchio-list
          </ExtLink>
        </>
      )}
    </div>
  )
}

function SidebarBody(props: SidebarBodyProps) {
  return (
    <>
      <SidebarHeader {...props} />
      <SidebarNav {...props} />
      <SidebarFooter {...props} />
    </>
  )
}

export function Sidebar() {
  const collapsed = usePrefs((s) => s.sidebarCollapsed)
  const toggle = usePrefs((s) => s.toggleSidebar)
  return (
    <aside
      className={cn(
        'hidden h-screen flex-col border-r bg-card transition-[width] duration-150 md:flex',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      <SidebarBody variant="desktop" collapsed={collapsed} onToggleCollapsed={toggle} />
    </aside>
  )
}

export function MobileTopBar() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    // Close the drawer whenever the URL changes (NavLink clicks already call
    // onNavigate, but back-button navigation doesn't — this handles that).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [location.pathname, location.hash])
  return (
    <header className="flex h-12 items-center justify-between gap-2 border-b bg-card px-2 pt-[env(safe-area-inset-top)] md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('sidebar.openNav')} className="h-10 w-10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 pt-[env(safe-area-inset-top)]">
          <SheetTitle className="sr-only">{t('sidebar.navigation')}</SheetTitle>
          <SheetDescription className="sr-only">
            {t('sidebar.navDescription')}
          </SheetDescription>
          <SidebarBody variant="mobile" onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <Library className="h-5 w-5" />
        <span className="text-sm font-semibold">Itch.io DB</span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle showLabel={false} />
      </div>
    </header>
  )
}
