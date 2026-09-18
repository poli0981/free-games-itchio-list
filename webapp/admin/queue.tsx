import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { adminApi, errorText, shortSha, type Candidate, type CandidateStatus } from './api'
import { Notice, PUBLISH_NOTE } from './app'

const STATUSES: { id: CandidateStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'queued', label: 'Queued' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'ingested', label: 'Ingested' },
]

const SOURCE: Record<Candidate['source'], string> = { rss: 'RSS', form: 'Suggest form', ext: 'Extension', admin: 'Admin' }

const FLAG: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' }> = {
  previously_deleted: { label: 'previously removed', variant: 'destructive' },
  nsfw_keyword: { label: 'NSFW?', variant: 'secondary' },
  demo: { label: 'demo', variant: 'outline' },
}

export function QueuePage() {
  const [status, setStatus] = useState<CandidateStatus>('pending')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null)
  const client = useQueryClient()
  const queue = useQuery({ queryKey: ['queue', status], queryFn: () => adminApi.queue(status) })

  const done = () => {
    setSelected(new Set())
    void client.invalidateQueries({ queryKey: ['queue'] })
  }
  const approve = useMutation({
    mutationFn: ({ urls, override }: { urls: string[]; override: boolean }) => adminApi.approve(urls, override),
    onSuccess: (d) => {
      const skipped = d.skipped.map((s) => `  ${s.url} — ${s.reason.replace(/_/g, ' ')}`).join('\n')
      setNotice({
        tone: 'info',
        text:
          `Queued ${d.approved.length} for ingest (${shortSha(d.sha)}). ${PUBLISH_NOTE}` +
          (skipped ? `\nSkipped:\n${skipped}` : ''),
      })
      done()
    },
    onError: (e) => setNotice({ tone: 'error', text: errorText(e) }),
  })
  const reject = useMutation({
    mutationFn: (urls: string[]) => adminApi.reject(urls),
    onSuccess: (d) => {
      setNotice({ tone: 'info', text: `Rejected ${d.rejected.length} (they stay blocked from every source).` })
      done()
    },
    onError: (e) => setNotice({ tone: 'error', text: errorText(e) }),
  })

  const items = queue.data?.items ?? []
  const allSelected = items.length > 0 && items.every((c) => selected.has(c.url))
  const toggle = (url: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  const urls = [...selected]
  const busy = approve.isPending || reject.isPending
  const canApprove = status !== 'queued' && status !== 'ingested'

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-1" role="tablist" aria-label="Queue status">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={status === s.id}
            onClick={() => {
              setStatus(s.id)
              setSelected(new Set())
            }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm hover:bg-accent',
              status === s.id && 'bg-accent font-medium',
            )}
          >
            {s.label}
            <span className="ml-1.5 tabular-nums text-muted-foreground">{queue.data?.counts[s.id] ?? ''}</span>
          </button>
        ))}
      </div>

      {notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}

      {canApprove && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" disabled={!selected.size || busy} onClick={() => approve.mutate({ urls, override: false })}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!selected.size || busy}
            title="Also brings back games that were removed from the catalog before"
            onClick={() => {
              if (window.confirm(`Approve ${urls.length} game(s), including previously removed ones?`)) {
                approve.mutate({ urls, override: true })
              }
            }}
          >
            Approve with override
          </Button>
          {status !== 'rejected' && (
            <Button size="sm" variant="destructive" disabled={!selected.size || busy} onClick={() => reject.mutate(urls)}>
              Reject
            </Button>
          )}
        </div>
      )}

      {queue.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {queue.error && <Notice text={errorText(queue.error)} tone="error" onClose={() => void queue.refetch()} />}
      {queue.data && items.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}

      {items.length > 0 && (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr>
              {canApprove && (
                <th className="w-8 py-2">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((c) => c.url)))}
                  />
                </th>
              )}
              <th className="w-20 py-2">Cover</th>
              <th className="py-2">Game</th>
              <th className="py-2">From</th>
              <th className="py-2">Found</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.url} className="border-b align-top last:border-0">
                {canApprove && (
                  <td className="py-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${c.title ?? c.url}`}
                      checked={selected.has(c.url)}
                      onChange={() => toggle(c.url)}
                    />
                  </td>
                )}
                <td className="py-2">
                  {c.image_url ? (
                    <img src={c.image_url} alt="" loading="lazy" className="h-12 w-16 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-16 rounded bg-muted" />
                  )}
                </td>
                <td className="py-2">
                  <a href={c.url} target="_blank" rel="noreferrer noopener" className="font-medium hover:underline">
                    {c.title ?? c.url.replace('https://', '')}
                  </a>
                  <div className="text-xs text-muted-foreground">{c.url.replace('https://', '')}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.genre_hint && <Badge variant="outline">{c.genre_hint}</Badge>}
                    {c.flags.map((f) => (
                      <Badge key={f} variant={FLAG[f]?.variant ?? 'outline'}>
                        {FLAG[f]?.label ?? f}
                      </Badge>
                    ))}
                  </div>
                  {c.note && <p className="mt-1 whitespace-pre-line text-xs">“{c.note}”</p>}
                </td>
                <td className="py-2 text-xs text-muted-foreground">
                  {SOURCE[c.source]}
                  {c.submitter && c.source !== 'form' && c.source !== 'admin' && <div>{c.submitter}</div>}
                </td>
                <td className="py-2 text-xs tabular-nums text-muted-foreground">{c.discovered_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
