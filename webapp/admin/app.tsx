import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import { useThemeEffect } from '@/hooks/useThemeEffect'
import { cn } from '@/lib/utils'
import { SessionExpired, adminApi, isSessionExpired, subscribeSession } from './api'
import { ActivityPage } from './activity'
import { AddPage } from './add'
import { CatalogPage } from './catalog'
import { NewGamesPage } from './new-games'
import { QueuePage } from './queue'
import { SettingsPage } from './settings'
import { errorText } from './texts'
import { ConfirmDialog, ThemeToggle } from './ui'

const NAV = [
  { to: '/queue', label: 'Review queue' },
  { to: '/add', label: 'Add games' },
  { to: '/catalog', label: 'Catalog' },
  { to: '/new', label: 'New games' },
  { to: '/activity', label: 'Activity' },
  { to: '/settings', label: 'Settings' },
]

export function AdminApp() {
  useThemeEffect()
  const me = useQuery({ queryKey: ['me'], queryFn: adminApi.me })
  const expired = useSyncExternalStore(subscribeSession, isSessionExpired)

  if (me.error) {
    return (
      <div className="mx-auto max-w-lg p-8 text-sm">
        <h1 className="mb-2 text-lg font-semibold">Admin unavailable</h1>
        <p className="mb-4 whitespace-pre-line text-muted-foreground">{errorText(me.error)}</p>
        {me.error instanceof SessionExpired && (
          <button className="underline" onClick={() => window.location.reload()}>
            Sign in again
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4 text-sm">
          <span className="shrink-0 font-semibold">freeitchgames.win · admin</span>
          <nav className="scrollbar-hide flex min-w-0 gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn('shrink-0 rounded-md px-3 py-1.5 hover:bg-accent', isActive && 'bg-accent font-medium')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-muted-foreground xl:inline">{me.data ? me.data.email : '…'}</span>
            {me.data && !me.data.writes && (
              <span
                className="shrink-0 rounded-md border border-destructive/40 px-2 py-0.5 text-xs text-destructive"
                title="The GitHub App is not configured: nothing can be written."
              >
                read-only
              </span>
            )}
            <ThemeToggle />
            <a className="shrink-0 text-muted-foreground hover:text-foreground" href="/" target="_blank" rel="noreferrer">
              Site ↗
            </a>
          </div>
        </div>
      </header>
      {expired && (
        <div role="alert" className="border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <span>Your admin session has expired. Sign in again, then retry — nothing on this page is lost.</span>
            <a className="font-medium underline" href="/admin/" target="_blank" rel="noopener">
              Sign in (new tab)
            </a>
            <button className="underline" onClick={() => window.location.reload()}>
              Reload this page
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl p-4">
        <Routes>
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/new" element={<NewGamesPage />} />
          <Route path="/activity" element={<ActivityPage repo={me.data?.repo ?? null} />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/queue" replace />} />
        </Routes>
      </main>
      <ConfirmDialog />
    </div>
  )
}
