import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExtLink } from '@/components/ext-link'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useT, type MessageKey } from '@/lib/i18n'
import { isTauri } from '@/lib/runtime'
import { SITE_ORIGIN } from '@/lib/config'
import { loadTurnstile } from '@/lib/turnstile'

const MAX_NOTE = 500
const ITCH_GAME = /^\s*(https?:\/\/)?[a-z0-9-]+\.itch\.io\/[a-z0-9_-]+\/?\s*$/i

type Result = { tone: 'ok' | 'error'; key: MessageKey }

const STATUS_KEY: Record<string, MessageKey> = {
  received: 'suggest.status.received',
  already_listed: 'suggest.status.alreadyListed',
  already_suggested: 'suggest.status.alreadySuggested',
  not_accepted: 'suggest.status.notAccepted',
}
const ERROR_KEY: Record<string, MessageKey> = {
  invalid_url: 'suggest.error.invalidUrl',
  rate_limited: 'suggest.error.rateLimited',
  challenge_failed: 'suggest.error.challenge',
}

interface SuggestConfig {
  enabled: boolean
  sitekey: string | null
}

export default function Suggest() {
  const t = useT()
  useDocumentTitle(t('titles.suggest'))

  if (isTauri()) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 pt-6 pb-12 sm:px-8 md:pt-7">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{t('titles.suggest')}</h1>
        <p className="text-muted-foreground">{t('suggest.webOnly')}</p>
        <ExtLink href={`${SITE_ORIGIN}/suggest`} className="text-primary underline-offset-4 hover:underline">
          {t('suggest.openWebsite')}
        </ExtLink>
      </div>
    )
  }
  return <SuggestForm />
}

function SuggestForm() {
  const t = useT()
  const config = useQuery({
    queryKey: ['suggest-config'],
    // The Worker always answers 200 when suggestions are deliberately off, so
    // any other status is a failure to retry, not "closed".
    queryFn: async (): Promise<SuggestConfig> => {
      const res = await fetch('/api/suggest')
      if (!res.ok) throw new Error(`suggest config: HTTP ${res.status}`)
      return (await res.json()) as SuggestConfig
    },
    staleTime: 60_000,
  })
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [token, setToken] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const widget = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  const sitekey = config.data?.enabled ? config.data.sitekey : null
  useEffect(() => {
    if (!sitekey || !widget.current) return
    let cancelled = false
    const el = widget.current
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return
        widgetId.current = turnstile.render(el, {
          sitekey,
          action: 'suggest',
          theme: 'auto',
          callback: setToken,
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
        })
      })
      .catch(() => setResult({ tone: 'error', key: 'suggest.error.challengeLoad' }))
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = null
    }
  }, [sitekey])

  const urlValid = ITCH_GAME.test(url)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!urlValid || !token || sending) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), note: note.trim(), token }),
      })
      const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string }
      if (res.ok && data.status) {
        setResult({ tone: data.status === 'received' ? 'ok' : 'error', key: STATUS_KEY[data.status] ?? 'suggest.error.generic' })
        if (data.status === 'received') {
          setUrl('')
          setNote('')
        }
      } else {
        setResult({ tone: 'error', key: ERROR_KEY[data.error ?? ''] ?? 'suggest.error.generic' })
      }
    } catch {
      setResult({ tone: 'error', key: 'suggest.error.generic' })
    } finally {
      setSending(false)
      setToken('')
      if (widgetId.current) window.turnstile?.reset(widgetId.current)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 pt-6 pb-12 sm:px-8 md:pt-7">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{t('titles.suggest')}</h1>
      <p className="leading-relaxed text-muted-foreground">{t('suggest.intro')}</p>

      {config.isPending ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : config.isError ? (
        <div role="alert" className="space-y-2 rounded-md border p-3 text-sm">
          <p className="text-destructive">{t('suggest.error.config')}</p>
          <Button size="sm" variant="outline" onClick={() => void config.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      ) : !config.data.enabled ? (
        <p className="rounded-md border p-3 text-sm">{t('suggest.closed')}</p>
      ) : (
        // noValidate: the page validates the link itself (a link without
        // https:// is fine; the server adds it), the browser's type=url check doesn't agree.
        <form noValidate onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="suggest-url">{t('suggest.url')}</Label>
            <Input
              id="suggest-url"
              type="url"
              inputMode="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://creator.itch.io/game"
              aria-invalid={url !== '' && !urlValid}
              aria-describedby="suggest-url-hint"
            />
            <p id="suggest-url-hint" className="text-xs text-muted-foreground">
              {url !== '' && !urlValid ? t('suggest.error.invalidUrl') : t('suggest.urlHint')}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="suggest-note">{t('suggest.note')}</Label>
            <textarea
              id="suggest-note"
              value={note}
              maxLength={MAX_NOTE}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby="suggest-note-hint"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-primary focus-visible:outline-hidden"
            />
            <p id="suggest-note-hint" className="text-xs text-muted-foreground">
              {t('suggest.notePrivacy')} ({note.length}/{MAX_NOTE})
            </p>
          </div>
          <div ref={widget} aria-label={t('suggest.challenge')} className="min-h-[65px]" />
          <Button type="submit" disabled={!urlValid || !token || sending}>
            {sending ? t('suggest.sending') : t('suggest.submit')}
          </Button>
          {result && (
            <p role={result.tone === 'error' ? 'alert' : 'status'} className={result.tone === 'error' ? 'text-sm text-destructive' : 'text-sm'}>
              {t(result.key)}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
