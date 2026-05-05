import { NavLink } from 'react-router-dom'
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
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExtLink } from '@/components/ext-link'
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

export function Sidebar() {
  const user = useAuth((s) => s.user)
  const hasStoredPat = useAuth((s) => s.hasStoredPat)
  const collapsed = usePrefs((s) => s.sidebarCollapsed)
  const toggle = usePrefs((s) => s.toggleSidebar)

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-[width] duration-150',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b',
          collapsed ? 'justify-center px-2' : 'gap-2 px-3',
        )}
      >
        {!collapsed && (
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
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn('h-8 w-8', !collapsed && 'ml-1')}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className={cn('flex flex-1 flex-col gap-1 p-2', !collapsed && 'p-3')}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md text-sm transition-colors',
                collapsed ? 'h-10 w-10 justify-center' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      <div
        className={cn(
          'space-y-2 border-t',
          collapsed ? 'flex flex-col items-center gap-2 p-2 space-y-0' : 'p-3',
        )}
      >
        {isTauri() && !collapsed && (
          <div className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
            Desktop mode (Tauri)
          </div>
        )}
        {collapsed ? (
          <>
            <SyncButton />
            <ThemeToggle showLabel={false} />
            {user ? (
              <img
                src={user.avatar_url}
                alt={user.login}
                title={`Signed in as ${user.login}`}
                className="h-6 w-6 rounded-full"
              />
            ) : hasStoredPat ? (
              <span title="PAT saved but locked" className="h-2 w-2 rounded-full bg-yellow-500" />
            ) : (
              <span
                title="No PAT saved"
                className="h-2 w-2 rounded-full bg-muted-foreground/40"
              />
            )}
          </>
        ) : (
          <>
            <ThemeToggle />
            <ExtLink
              href="https://github.com/poli0981/free-games-itchio-list"
              className="block text-xs text-muted-foreground hover:underline"
            >
              poli0981/free-games-itchio-list
            </ExtLink>
          </>
        )}
      </div>
    </aside>
  )
}
