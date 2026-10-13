import { useMemo, useRef, useState, type DragEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MAX_TRACK_URLS, MAX_URLS } from '../worker/limits'
import {
  adminApi,
  shortSha,
  type AddResult,
  type CheckResult,
  type CollectionItem,
  type CollectionRead,
  type TrackItem,
} from './api'
import { chunk, runBatches } from './batch'
import { GROUPS, groupResults } from './check-groups'
import { confirm } from './confirm'
import { extractGameUrls } from './extract'
import { INGEST_TEXT, PUBLISH_NOTE, errorText, plural, when } from './texts'
import { summarize, useTracking, type TrackedBatch } from './tracking'
import { BatchProgress, Notice, TabBar, type NoticeState } from './ui'

const MAX_FILE_BYTES = 5 * 1024 * 1024
/** One ingest run (45 minutes at ≈ 14.5 games a minute) handles about this many games. */
const PER_INGEST_RUN = 650

type Source = 'paste' | 'collection'

interface Collected {
  read: CollectionRead['collection']
  free: CollectionItem[]
  priced: number
  pages: number
  nextPage: number | null
  stopped?: string
}

export function AddPage() {
  const [source, setSource] = useState<Source>('paste')
  const [text, setText] = useState('')
  const [collected, setCollected] = useState<Collected | null>(null)
  const [checked, setChecked] = useState<{ key: string; results: CheckResult[] } | null>(null)
  const [withRemoved, setWithRemoved] = useState(false)
  const [withRejected, setWithRejected] = useState(false)
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null)
  const [notice, setNotice] = useState<NoticeState>(null)
  const client = useQueryClient()
  const track = useTracking((s) => s.track)

  const pasted = useMemo(() => extractGameUrls(text), [text])
  const urls = source === 'paste' ? pasted.urls : (collected?.free.map((i) => i.url) ?? [])
  const via = source === 'collection' && collected ? `collection:${collected.read.id}` : undefined
  const key = `${source}\n${urls.join('\n')}`
  const results = checked?.key === key ? checked.results : null
  const groups = useMemo(() => (results ? groupResults(results) : null), [results])
  const busy = progress !== null

  const check = async () => {
    setNotice(null)
    const run = await runBatches(
      chunk(urls, MAX_URLS),
      (batch) => adminApi.check(batch),
      (done, total) => setProgress({ label: 'Checking', done, total }),
    )
    setProgress(null)
    if (run.failed) setNotice({ tone: 'error', text: errorText(run.failed.error) })
    else setChecked({ key, results: run.results.flatMap((r) => r.results) })
  }

  const add = async () => {
    if (!groups) return
    const normal = [...groups.new, ...groups.waiting]
    const override = [...(withRemoved ? groups.removed : []), ...(withRejected ? groups.rejected : [])]
    const total = normal.length + override.length
    if (total > 1000) {
      const runs = Math.ceil(total / PER_INGEST_RUN)
      const ok = await confirm({
        title: `Queue ${plural(total, 'game')}?`,
        body: `The ingest workflow handles about ${PER_INGEST_RUN} games per run, so this takes about ${runs} runs (45 minutes each); the rest waits in the queue meanwhile.`,
        action: `Queue ${plural(total, 'game')}`,
      })
      if (!ok) return
    }
    setNotice(null)
    const batches = [
      ...chunk(normal, MAX_URLS).map((b) => ({ urls: b, override: false })),
      ...chunk(override, MAX_URLS).map((b) => ({ urls: b, override: true })),
    ]
    const run = await runBatches(
      batches.map((b) => [b]),
      ([b]) => adminApi.add(b.urls, b.override, via),
      (done, all) => setProgress({ label: 'Adding', done, total: all }),
    )
    setProgress(null)
    const done: AddResult[] = run.results
    const queued = done.flatMap((r) => r.results.filter((x) => x.approved && x.url).map((x) => x.url as string))
    if (queued.length > 0 && done[0]) {
      const label = via ? `Collection #${collected?.read.id}: ${plural(queued.length, 'game')}` : `Add: ${plural(queued.length, 'game')}`
      track(label, done[0].at, queued)
    }
    const commits = done.map((r) => shortSha(r.sha)).filter((s) => s !== 'no commit')
    const lines: string[] = []
    if (queued.length > 0 || !run.failed) {
      lines.push(
        `Queued ${plural(queued.length, 'game')} for ingest${commits.length ? ` (${commits.join(', ')})` : ''}. Follow them under “Recent batches”. ${PUBLISH_NOTE}`,
      )
    }
    if (run.failed) {
      lines.push(errorText(run.failed.error))
      lines.push(
        `${plural(run.remaining.flat().reduce((n, b) => n + b.urls.length, 0), 'game')} not sent: Check again, then Add sends what is left.`,
      )
    }
    setNotice({ tone: run.failed ? 'error' : 'info', text: lines.join('\n') })
    if (!run.failed) {
      setChecked(null)
      if (source === 'paste') setText('')
      else setCollected(null)
    } else {
      // Re-check what is left, so a second Add sends only that.
      setChecked(null)
    }
    void client.invalidateQueries({ queryKey: ['queue'] })
  }

  const addable = groups ? groups.new.length + groups.waiting.length : 0
  const overridable = groups ? (withRemoved ? groups.removed.length : 0) + (withRejected ? groups.rejected.length : 0) : 0

  return (
    <section className="max-w-4xl">
      <h1 className="mb-1 text-lg font-semibold">Add games</h1>
      <p className="mb-3 text-sm text-muted-foreground">
        Paste or upload any list (plain links, Markdown, CSV, HTML, JSON), or read an itch.io collection. Check it
        first: new games are queued for the ingest workflow, which drops the ones that turn out to be paid.
      </p>

      <TabBar
        label="Where the list comes from"
        value={source}
        onChange={setSource}
        options={[
          { id: 'paste', label: 'Paste or upload' },
          { id: 'collection', label: 'itch.io collection' },
        ]}
      />

      {source === 'paste' ? (
        <PasteInput text={text} onText={setText} found={pasted.urls.length} repeats={pasted.duplicates} onError={setNotice} />
      ) : (
        <CollectionInput collected={collected} onCollected={setCollected} onError={setNotice} />
      )}

      {notice && (
        <div className="mt-4">
          <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />
        </div>
      )}
      {progress && <BatchProgress label={progress.label} done={progress.done} total={progress.total} />}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <Button variant="outline" disabled={urls.length === 0 || busy} onClick={() => void check()}>
          {busy && progress?.label === 'Checking' ? 'Checking…' : `Check ${urls.length ? plural(urls.length, 'URL') : ''}`}
        </Button>
        {groups && (
          <Button disabled={addable + overridable === 0 || busy} onClick={() => void add()}>
            {busy && progress?.label === 'Adding' ? 'Adding…' : `Add ${plural(addable + overridable, 'game')}`}
          </Button>
        )}
        {urls.length > 0 && !groups && <span className="text-muted-foreground">Check the list to see what Add would do.</span>}
      </div>

      {groups && (
        <div className="mt-4 space-y-2">
          {GROUPS.filter((g) => groups[g.id].length > 0).map((g) => (
            <details key={g.id} className="rounded-md border px-3 py-2 text-sm" open={g.id === 'new' && groups.new.length <= 20}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                <span className="font-medium">{g.label}</span>
                <span className="tabular-nums text-muted-foreground">{groups[g.id].length.toLocaleString('en-GB')}</span>
                <span className="text-xs text-muted-foreground">{g.hint}</span>
                {g.id === 'removed' && (
                  <label className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={withRemoved} onChange={(e) => setWithRemoved(e.target.checked)} />
                    Add with override
                  </label>
                )}
                {g.id === 'rejected' && (
                  <label className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={withRejected} onChange={(e) => setWithRejected(e.target.checked)} />
                    Add with override
                  </label>
                )}
              </summary>
              <ul className="mt-2 max-h-60 overflow-y-auto font-mono text-xs">
                {groups[g.id].map((u) => (
                  <li key={u} className="truncate py-0.5">
                    {u}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}

      <RecentBatches />
    </section>
  )
}

function PasteInput({
  text,
  onText,
  found,
  repeats,
  onError,
}: {
  text: string
  onText: (text: string) => void
  found: number
  repeats: number
  onError: (n: NoticeState) => void
}) {
  const file = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const load = async (files: FileList | null) => {
    const picked = files?.[0]
    if (!picked) return
    if (picked.size > MAX_FILE_BYTES) {
      onError({ tone: 'error', text: `${picked.name} is larger than 5 MB.` })
      return
    }
    const content = await picked.text()
    onText(text ? `${text}\n${content}` : content)
  }
  const drop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void load(e.dataTransfer.files)
  }

  return (
    <div>
      <label htmlFor="urls" className="sr-only">
        Game URLs or any text containing them
      </label>
      <textarea
        id="urls"
        value={text}
        onChange={(e) => onText(e.target.value)}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        rows={8}
        spellCheck={false}
        placeholder="https://creator.itch.io/game — or drop a .txt / .csv / .md / .html / .json file here"
        className={cn('w-full rounded-md border bg-background p-2 font-mono text-sm', dragging && 'border-primary ring-2 ring-primary/30')}
      />
      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          {found ? `${plural(found, 'game URL')} found` : 'No itch.io game URL yet'}
          {repeats > 0 && ` (${plural(repeats, 'repeat')} ignored)`}
        </span>
        <input
          ref={file}
          type="file"
          accept=".txt,.csv,.md,.html,.htm,.json,text/plain,text/csv,text/markdown,text/html,application/json"
          className="hidden"
          onChange={(e) => {
            void load(e.target.files)
            e.target.value = ''
          }}
        />
        <Button size="sm" variant="ghost" onClick={() => file.current?.click()}>
          Load a file…
        </Button>
        {text && (
          <Button size="sm" variant="ghost" onClick={() => onText('')}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

function CollectionInput({
  collected,
  onCollected,
  onError,
}: {
  collected: Collected | null
  onCollected: (c: Collected | null) => void
  onError: (n: NoticeState) => void
}) {
  const [url, setUrl] = useState('')
  const [reading, setReading] = useState(false)
  const [watching, setWatching] = useState(false)
  const stop = useRef(false)
  const client = useQueryClient()

  /** Ten pages per request, until the end of the collection or Stop. */
  const read = async () => {
    stop.current = false
    setReading(true)
    onError(null)
    let page = 1
    let free: CollectionItem[] = []
    const seen = new Set<string>()
    let priced = 0
    let pages = 0
    try {
      for (;;) {
        const r = await adminApi.readCollection(url, page)
        const fresh = r.items.filter((i) => i.price === null && !seen.has(i.url))
        for (const i of fresh) seen.add(i.url)
        free = [...free, ...fresh]
        priced += r.items.filter((i) => i.price !== null).length
        pages += r.pages
        onCollected({ read: r.collection, free, priced, pages, nextPage: r.nextPage, stopped: r.stopped })
        if (r.nextPage === null || r.stopped || stop.current) break
        page = r.nextPage
      }
    } catch (e) {
      onError({ tone: 'error', text: errorText(e) })
    } finally {
      setReading(false)
    }
  }

  const watch = async () => {
    setWatching(true)
    try {
      const { collection } = await adminApi.watch(collected?.read.url ?? url)
      onError({ tone: 'info', text: `Following collection #${collection.id}: the cron queues its new free games (Settings lists it).` })
      void client.invalidateQueries({ queryKey: ['settings'] })
    } catch (e) {
      onError({ tone: 'error', text: errorText(e) })
    } finally {
      setWatching(false)
    }
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://itch.io/c/1234567/collection-name"
          aria-label="itch.io collection URL"
          className="max-w-xl flex-1"
        />
        {reading ? (
          <Button variant="outline" onClick={() => (stop.current = true)}>
            Stop
          </Button>
        ) : (
          <Button variant="outline" disabled={!url.trim()} onClick={() => void read()}>
            Read collection
          </Button>
        )}
      </div>
      {collected && (
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span>
            <a href={collected.read.url} target="_blank" rel="noreferrer noopener" className="font-medium text-foreground hover:underline">
              Collection #{collected.read.id}
            </a>
            : {plural(collected.free.length, 'free game')} from {plural(collected.pages, 'page')}
            {collected.priced > 0 && ` (${plural(collected.priced, 'priced game')} skipped)`}
            {reading && ' — reading…'}
            {!reading && collected.nextPage !== null && ' — stopped before the end'}
            {collected.stopped && ` — itch.io: ${collected.stopped.replace(/_/g, ' ')}`}
          </span>
          <Button size="sm" variant="ghost" disabled={watching} onClick={() => void watch()}>
            Follow this collection
          </Button>
        </div>
      )}
    </div>
  )
}

const STATE_TEXT: Record<TrackItem['state'], string> = {
  waiting: 'waiting for the ingest',
  added: 'added',
  dropped: 'not added',
  unknown: 'unknown',
}

/** The batches queued from this browser, and how each game's ingest went. */
function RecentBatches() {
  const batches = useTracking((s) => s.batches)
  if (batches.length === 0) return null
  return (
    <div className="mt-8">
      <h2 className="mb-2 text-base font-semibold">Recent batches</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Queued from this browser. The ingest workflow starts right after each commit; results show up here as it
        finishes (checked every minute while something is waiting).
      </p>
      <div className="space-y-2">
        {batches.map((b, i) => (
          <BatchCard key={b.id} batch={b} live={i < 3} />
        ))}
      </div>
    </div>
  )
}

async function trackAll(batch: TrackedBatch): Promise<TrackItem[]> {
  const items: TrackItem[] = []
  for (const part of chunk(batch.urls, MAX_TRACK_URLS)) items.push(...(await adminApi.track(part, batch.at)).items)
  return items
}

function BatchCard({ batch, live }: { batch: TrackedBatch; live: boolean }) {
  const [open, setOpen] = useState(false)
  const forget = useTracking((s) => s.forget)
  const status = useQuery({
    queryKey: ['track', batch.id],
    queryFn: () => trackAll(batch),
    enabled: live || open,
    refetchInterval: (q) => (q.state.data?.some((i) => i.state === 'waiting') ? 60_000 : false),
    refetchIntervalInBackground: false,
  })
  const sum = status.data ? summarize(status.data) : null
  return (
    <details className="rounded-md border px-3 py-2 text-sm" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{batch.label}</span>
        <span className="text-xs text-muted-foreground">{when(batch.at)}</span>
        {sum && (
          <span className="text-xs tabular-nums">
            <span className="text-success">{sum.added} added</span>
            {sum.waiting > 0 && <span className="text-muted-foreground"> · {sum.waiting} waiting</span>}
            {sum.dropped > 0 && <span className="text-destructive"> · {sum.dropped} not added</span>}
            {sum.unknown > 0 && <span className="text-muted-foreground"> · {sum.unknown} unknown</span>}
          </span>
        )}
        {status.isFetching && <span className="text-xs text-muted-foreground">checking…</span>}
        {status.error && <span className="text-xs text-destructive">{errorText(status.error).split('\n')[0]}</span>}
        <button
          className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={(e) => {
            e.preventDefault()
            void status.refetch()
          }}
        >
          Check now
        </button>
        <button
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          onClick={(e) => {
            e.preventDefault()
            forget(batch.id)
          }}
        >
          Forget
        </button>
      </summary>
      {status.data && (
        <table className="mt-2 w-full text-xs">
          <tbody>
            {status.data.map((i) => (
              <tr key={i.url} className="border-b last:border-0">
                <td className="max-w-0 truncate py-1 pr-2 font-mono">
                  <a href={i.url} target="_blank" rel="noreferrer noopener" className="hover:underline">
                    {i.url.replace('https://', '')}
                  </a>
                </td>
                <td className="py-1 whitespace-nowrap text-muted-foreground">
                  {i.outcome ? (INGEST_TEXT[i.outcome] ?? i.outcome) : STATE_TEXT[i.state]}
                  {i.attempts ? ` (${plural(i.attempts, 'failed attempt')}: ${i.error ?? ''})` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </details>
  )
}
