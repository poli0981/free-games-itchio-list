import type { ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Bug,
  CircleAlert,
  CloudOff,
  FileWarning,
  Gauge,
  Home,
  Hourglass,
  Lock,
  RefreshCw,
  SearchX,
  ServerCrash,
  ShieldAlert,
  TimerOff,
  TimerReset,
  Unplug,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExtLink } from '@/components/ext-link'
import { ERROR_TEMPLATE_URL } from '@/lib/about'
import { useT, type MessageKey } from '@/lib/i18n'

interface ErrorMeta {
  icon: LucideIcon
  title: MessageKey
  desc: MessageKey
}

// Keyed by HTTP status (as string) plus the two non-HTTP variants.
const META: Record<string, ErrorMeta> = {
  '400': { icon: FileWarning, title: 'error.400.title', desc: 'error.400.desc' },
  '401': { icon: Lock, title: 'error.401.title', desc: 'error.401.desc' },
  '403': { icon: ShieldAlert, title: 'error.403.title', desc: 'error.403.desc' },
  '404': { icon: SearchX, title: 'error.404.title', desc: 'error.404.desc' },
  '408': { icon: TimerOff, title: 'error.408.title', desc: 'error.408.desc' },
  '419': { icon: TimerReset, title: 'error.419.title', desc: 'error.419.desc' },
  '429': { icon: Gauge, title: 'error.429.title', desc: 'error.429.desc' },
  '500': { icon: ServerCrash, title: 'error.500.title', desc: 'error.500.desc' },
  '502': { icon: Unplug, title: 'error.502.title', desc: 'error.502.desc' },
  '503': { icon: CloudOff, title: 'error.503.title', desc: 'error.503.desc' },
  '504': { icon: Hourglass, title: 'error.504.title', desc: 'error.504.desc' },
  offline: { icon: WifiOff, title: 'error.offline.title', desc: 'error.offline.desc' },
  chunk: { icon: RefreshCw, title: 'error.chunk.title', desc: 'error.chunk.desc' },
  unknown: { icon: CircleAlert, title: 'error.unknown.title', desc: 'error.unknown.desc' },
}

export interface ErrorPageProps {
  /** HTTP status code; unmapped codes fall back to the "unknown" treatment. */
  status?: number
  /** Non-HTTP variants (network down, stale chunk after redeploy). Wins over `status`. */
  variant?: 'offline' | 'chunk'
  /** Override the mapped title/description (e.g. game-not-found). */
  title?: string
  description?: string
  /** Raw error message, shown collapsed under "Technical details". */
  details?: string
  onRetry?: () => void
  /** Replaces the default "Back to home" action. */
  actions?: ReactNode
}

export function ErrorPage({
  status,
  variant,
  title,
  description,
  details,
  onRetry,
  actions,
}: ErrorPageProps) {
  const t = useT()
  const meta = META[variant ?? String(status ?? '')] ?? META.unknown
  const Icon = meta.icon
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border bg-card text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      {!variant && status !== undefined && (
        <p className="font-mono text-5xl font-semibold tracking-tight tabular-nums">{status}</p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{title ?? t(meta.title)}</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">{description ?? t(meta.desc)}</p>
      {details && (
        <details className="w-full text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground">{t('error.actions.details')}</summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
            {details}
          </pre>
        </details>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="size-4" />
            {t('common.retry')}
          </Button>
        )}
        {actions ?? (
          <Button variant={onRetry ? 'outline' : 'default'} asChild>
            <Link to="/">
              <Home className="size-4" />
              {t('error.actions.home')}
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild>
          <ExtLink href={ERROR_TEMPLATE_URL}>
            <Bug className="size-4" />
            {t('error.actions.report')}
          </ExtLink>
        </Button>
      </div>
    </div>
  )
}
