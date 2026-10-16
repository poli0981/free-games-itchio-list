import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MAX_URLS } from '../worker/limits'
import { adminApi, shortSha, type Candidate, type CandidateStatus, type Decision } from './api'
import { chunk, runBatches } from './batch'
import { confirm } from './confirm'
import { INGEST_TEXT, PUBLISH_NOTE, SKIP_TEXT, errorText, plural } from './texts'
import { useTracking } from './tracking'
import { BatchProgress, Notice, TabBar, type NoticeState } from './ui'

const STATUSES: { id: CandidateStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'queued', label: 'Queued' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'ingested', label: 'Ingested' },
]

const SOURCE: Record<Candidate['source'], string> = { rss: 'RSS', form: 'Suggest form', admin: 'Admin' }

const FLAG: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' }> = {
  previously_deleted: { label: 'previously removed', variant: 'destructive' },
  nsfw_keyword: { label: 'NSFW?', variant: 'secondary' },
  demo: { label: 'demo', variant: 'outline' },
}

function source(c: Candidate): string {
  const collection = /^collection:(\d+)$/.exec(c.submitter ?? '')
  if (collection) return `Collection #${collection[1]}`
  return SOURCE[c.source]
}

export function QueuePage() {
  const [status, setStatus] = useState<CandidateStatus>('pending')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState<NoticeState>(null)
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null)
  const client = useQueryClient()
  const track = useTracking((s) => s.track)
  const queue = useQuery({ queryKey: ['queue', status], queryFn: () => adminApi.queue(status) })

  const finish = () => {
    setSelected(new Set())
    setProgress(null)
    void client.invalidateQueries({ queryKey: ['queue'] })
  }

  /** Approve in batches of 200 (one commit each); stops at the first error. */
  const approve = async (override: boolean) => {
    const urls = [...selected]
    if (override) {
      const ok = await confirm({
        title: `Approve ${plural(urls.length, 'game')} with override?`,
        body: 'Previously removed games are let through the ingest again. A game that is still paid or gone stays on the removed list.',
        action: 'Approve with override',
      })
      if (!ok) return
    }
    setNotice(null)
    const run = await runBatches(
      chunk(urls, MAX_URLS),
      (batch) => adminApi.approve(batch, override),
      (done, total) => setProgress({ label: 'Approving', done, total }),
    )
    const decisions: Decision[] = run.results
    const approved = decisions.flatMap((d) => d.approved)
    const skipped = decisions.flatMap((d) => d.skipped)
    if (approved.length > 0 && decisions[0]) track(`Queue: approved ${plural(approved.length, 'game')}`, decisions[0].at, approved)
    const lines = [
      `Queued ${plural(approved.length, 'game')} for ingest (${decisions.map((d) => shortSha(d.sha)).join(', ') || 'no commit'}). ${PUBLISH_NOTE}`,
      ...(skipped.length > 0 ? ['Skipped:', ...skipped.map((s) => `  ${s.url} — ${SKIP_TEXT[s.reason] ?? s.reason}`)] : []),
      ...(run.failed ? [`Stopped: ${errorText(run.failed.error)}`, `${plural(run.remaining.flat().length, 'game')} not sent — select them again to retry.`] : []),
    ]
    setNotice({ tone: run.failed ? 'error' : 'info', text: lines.join('\n') })
    finish()
  }

  const reject = async () => {
    const urls = [...selected]
    setNotice(null)
    const run = await runBatches(
      chunk(urls, MAX_URLS),
      (batch) => adminApi.reject(batch),
      (done, total) => setProgress({ label: 'Rejecting', done, total }),
    )
    const rejected = run.results.flatMap((r) => r.rejected)
    setNotice({
      tone: run.failed ? 'error' : 'info',
      text: [
        `Rejected ${plural(rejected.length, 'game')} (they stay blocked from every source).`,
        ...(run.failed ? [`Stopped: ${errorText(run.failed.error)}`] : []),
      ].join('\n'),
    })
    finish()
  }

  const items = queue.data?.items ?? []
  const total = queue.data?.counts[status] ?? 0
  const allSelected = items.length > 0 && items.every((c) => selected.has(c.url))
  const toggle = (url: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  const busy = progress !== null
  const canApprove = status !== 'queued' && status !== 'ingested'

  return (
    <section>
      <TabBar
        label="Queue status"
        value={status}
        onChange={(s) => {
          setStatus(s)
          setSelected(new Set())
        }}
        options={STATUSES.map((s) => ({
          id: s.id,
          label: (
            <>
              {s.label}
              <span className="ml-1.5 tabular-nums text-muted-foreground">{queue.data?.counts[s.id] ?? ''}</span>
            </>
          ),
        }))}
      />

      {notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
      {progress && <BatchProgress label={progress.label} done={progress.done} total={progress.total} />}

      {canApprove && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" disabled={!selected.size || busy} onClick={() => void approve(false)}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!selected.size || busy}
            title="Also brings back games that were removed from the catalog before"
            onClick={() => void approve(true)}
          >
            Approve with override
          </Button>
          {status !== 'rejected' && (
            <Button size="sm" variant="destructive" disabled={!selected.size || busy} onClick={() => void reject()}>
              Reject
            </Button>
          )}
        </div>
      )}

      {queue.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {queue.error && <Notice text={errorText(queue.error)} tone="error" onClose={() => void queue.refetch()} />}
      {queue.data && items.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
      {items.length > 0 && total > items.length && (
        <p className="mb-2 text-xs text-muted-foreground">
          Showing the newest {items.length.toLocaleString('en-GB')} of {total.toLocaleString('en-GB')}.
        </p>
      )}

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
                    {c.outcome && (
                      <Badge variant={c.outcome === 'added' || c.outcome === 'duplicate' ? 'outline' : 'secondary'}>
                        last ingest: {INGEST_TEXT[c.outcome] ?? c.outcome}
                      </Badge>
                    )}
                  </div>
                  {c.note && <p className="mt-1 whitespace-pre-line text-xs">“{c.note}”</p>}
                </td>
                <td className="py-2 text-xs text-muted-foreground">
                  {source(c)}
                  {c.submitter && c.source === 'rss' && <div>{c.submitter}</div>}
                  {c.decided_by === 'auto' && <div>approved automatically</div>}
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
