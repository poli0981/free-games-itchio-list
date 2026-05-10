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
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/add', label: 'Add Game', icon: Plus },
  { to: '/charts', label: 'Charts', icon: BarChart3 },
  { to: '/workflows', label: 'Workflows', icon: Workflow },
  { to: '/deleted', label: 'Deleted', icon: Trash2 },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about', label: 'About', icon: Info },
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
                title={`Signed in as ${user.login}`}
                width={24}
                height={24}
                loading="lazy"
                decoding="async"
                className="h-6 w-6 rounded-full"
              />
            ) : hasStoredPat ? (
              <span title="PAT saved but locked" className="h-2 w-2 rounded-full bg-yellow-500" />
            ) : (
              <span title="No PAT saved" className="h-2 w-2 rounded-full bg-muted-foreground/40" />
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
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      )}
    </div>
  )
}

function SidebarNav({ collapsed, variant, onNavigate }: SidebarBodyProps) {
  const isCompact = variant === 'desktop' && collapsed
  return (
    <nav className={cn('flex flex-1 flex-col gap-1 p-2', !isCompact && 'p-3')}>
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={isCompact ? label : undefined}
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
          {!isCompact && label}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarFooter({ collapsed, variant, onNavigate }: SidebarBodyProps) {
  const user = useAuth((s) => s.user)
  const hasStoredPat = useAuth((s) => s.hasStoredPat)
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
          Desktop mode (Tauri)
        </div>
      )}
      {isCompact ? (
        <>
          <SyncButton />
          <ThemeToggle showLabel={false} />
          <NavLink
            to="/about#support"
            onClick={onNavigate}
            title="Support the project"
            aria-label="Support the project"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Heart className="h-4 w-4" />
          </NavLink>
          {user ? (
            <img
              src={user.avatar_url}
              alt={user.login}
              title={`Signed in as ${user.login}`}
              width={24}
              height={24}
              loading="lazy"
              decoding="async"
              className="h-6 w-6 rounded-full"
            />
          ) : hasStoredPat ? (
            <span title="PAT saved but locked" className="h-2 w-2 rounded-full bg-yellow-500" />
          ) : (
            <span title="No PAT saved" className="h-2 w-2 rounded-full bg-muted-foreground/40" />
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
            Support the project
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
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => {
    // Close the drawer whenever the URL changes (NavLink clicks already call
    // onNavigate, but back-button navigation doesn't — this handles that).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [location.pathname, location.hash])
  return (
    <header className="flex h-12 items-center justify-between gap-2 border-b bg-card px-2 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation" className="h-10 w-10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Browse routes, support links, and account status.
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
