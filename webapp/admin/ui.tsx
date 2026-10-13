/** Small building blocks shared by the admin pages. */
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { THEME_ICON } from '@/components/theme-icon'
import { thumbUrl } from '@/lib/thumbnail'
import { cn } from '@/lib/utils'
import { useThemeStore, type Theme } from '@/stores/theme'
import { answer, useConfirm } from './confirm'

/** A line reporting what the last action did; dismissible when `onClose` is given. */
export function Notice({ text, tone = 'info', onClose }: { text: string; tone?: 'info' | 'error'; onClose?: () => void }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-4 flex items-start gap-3 rounded-md border px-3 py-2 text-sm',
        tone === 'error' ? 'border-destructive/50 text-destructive' : 'bg-muted/50',
      )}
    >
      <span className="flex-1 whitespace-pre-line">{text}</span>
      {onClose && (
        <button aria-label="Dismiss" className="text-muted-foreground hover:text-foreground" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  )
}

export type NoticeState = { text: string; tone: 'info' | 'error' } | null

/** A row of tab-like buttons (the admin's sub-pages and filters). */
export function TabBar<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: ReactNode }[]
  onChange: (id: T) => void
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1 text-sm" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn('rounded-md px-3 py-1.5 hover:bg-accent', value === o.id && 'bg-accent font-medium')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** "N selected" and the actions on the selection, kept in view while scrolling a long list. */
export function SelectionBar({ count, max, onClear, children }: { count: number; max: number; onClear: () => void; children: ReactNode }) {
  if (count === 0) return null
  return (
    <div className="sticky top-12 z-[5] mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-background/95 px-3 py-2 text-sm shadow-xs backdrop-blur-sm">
      <span className="tabular-nums">
        {count} selected{count >= max && <span className="text-muted-foreground"> (the most one action takes)</span>}
      </span>
      <button className="text-muted-foreground underline-offset-4 hover:underline" onClick={onClear}>
        Clear
      </button>
      <div className="ml-auto flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export function BatchProgress({ done, total, label }: { done: number; total: number; label: string }) {
  if (total <= 1) return null
  return (
    <div className="my-3 text-sm" role="status">
      <div className="mb-1 text-muted-foreground">
        {label}: batch {Math.min(done + 1, total)} of {total}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-[width]" style={{ width: `${(done / total) * 100}%` }} />
      </div>
    </div>
  )
}

const NEXT_THEME: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' }
const THEME_NAME: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' }

/** The site's theme choice (shared with the public site: same browser storage). */
export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const Icon = THEME_ICON[theme]
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT_THEME[theme])}
      title={`Theme: ${THEME_NAME[theme]} (click for ${THEME_NAME[NEXT_THEME[theme]]})`}
      aria-label={`Theme: ${THEME_NAME[theme]}. Switch to ${THEME_NAME[NEXT_THEME[theme]]}`}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}

/** The dialog behind confirm() (admin/confirm.ts); mounted once in the app shell. */
export function ConfirmDialog() {
  const request = useConfirm((s) => s.request)
  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && answer(false)}>
      <DialogContent className="max-w-md">
        <div className="space-y-2 pr-6">
          <DialogTitle className="text-lg font-semibold tracking-tight">{request?.title}</DialogTitle>
          {request?.body && (
            <DialogDescription className="text-sm whitespace-pre-line text-muted-foreground">{request.body}</DialogDescription>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => answer(false)}>
            Cancel
          </Button>
          <Button variant={request?.destructive ? 'destructive' : 'default'} onClick={() => answer(true)}>
            {request?.action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** A game's cover: the site's resized copy, or itch.io's original if that fails (e.g. no verification pass). */
export function Cover({ src, className }: { src: string | null | undefined; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || !src.startsWith('https://')) return <div className={cn('rounded bg-muted', className)} />
  return (
    <img
      src={failed ? src : thumbUrl(src, 160)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('rounded object-cover', className)}
    />
  )
}
