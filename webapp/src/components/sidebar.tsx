import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Gamepad2,
  Plus,
  BarChart3,
  Workflow,
  Trash2,
  Settings,
  Library,
  type LucideIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SyncButton } from '@/components/sync-button'
import { useAuth } from '@/stores/auth'
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
]

export function Sidebar() {
  const user = useAuth((s) => s.user)
  const hasStoredPat = useAuth((s) => s.hasStoredPat)
  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-3">
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
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t p-3">
        {isTauri() && (
          <div className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
            Desktop mode (Tauri)
          </div>
        )}
        <ThemeToggle />
        <a
          href="https://github.com/poli0981/free-games-itchio-list"
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-muted-foreground hover:underline"
        >
          poli0981/free-games-itchio-list
        </a>
      </div>
    </aside>
  )
}
