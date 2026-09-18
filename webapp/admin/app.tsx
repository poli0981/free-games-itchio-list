import { useQuery } from '@tanstack/react-query'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import { cn } from '@/lib/utils'
import { SessionExpired, adminApi, errorText } from './api'
import { AddPage } from './add'
import { CatalogPage } from './catalog'
import { QueuePage } from './queue'

const NAV = [
  { to: '/queue', label: 'Review queue' },
  { to: '/add', label: 'Add games' },
  { to: '/catalog', label: 'Catalog' },
]

export function AdminApp() {
  const me = useQuery({ queryKey: ['me'], queryFn: adminApi.me })

  if (me.error) {
    return (
      <div className="mx-auto max-w-lg p-8 text-sm">
        <h1 className="mb-2 text-lg font-semibold">Admin unavailable</h1>
        <p className="mb-4 text-muted-foreground">{errorText(me.error)}</p>
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
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-6 px-4 text-sm">
          <span className="font-semibold">freeitchgames.win · admin</span>
          <nav className="flex gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn('rounded-md px-3 py-1.5 hover:bg-accent', isActive && 'bg-accent font-medium')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <span className="ml-auto truncate text-muted-foreground">
            {me.data ? me.data.email : '…'}
            {me.data && !me.data.writes && ' · read-only (GitHub App not configured)'}
          </span>
          <a className="text-muted-foreground hover:text-foreground" href="/" target="_blank" rel="noreferrer">
            Site ↗
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Routes>
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/add" element={<AddPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="*" element={<Navigate to="/queue" replace />} />
        </Routes>
      </main>
    </div>
  )
}

/** A dismissible line reporting what the last action did. */
export function Notice({ text, tone = 'info', onClose }: { text: string; tone?: 'info' | 'error'; onClose: () => void }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-4 flex items-start gap-3 rounded-md border px-3 py-2 text-sm',
        tone === 'error' ? 'border-destructive/50 text-destructive' : 'bg-muted/50',
      )}
    >
      <span className="flex-1 whitespace-pre-line">{text}</span>
      <button aria-label="Dismiss" className="text-muted-foreground hover:text-foreground" onClick={onClose}>
        ×
      </button>
    </div>
  )
}

export const PUBLISH_NOTE = 'The public site shows it after the next build (a few minutes).'
