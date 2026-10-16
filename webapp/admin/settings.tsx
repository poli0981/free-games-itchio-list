import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { adminApi, shortSha, type Automation, type CandidateSource, type SettingsData, type WatchedCollection } from './api'
import { confirm } from './confirm'
import { errorText, plural, when } from './texts'
import { Notice, type NoticeState } from './ui'

const SOURCES: { id: CandidateSource; label: string }[] = [
  { id: 'rss', label: 'RSS discovery' },
  { id: 'form', label: 'Suggest form' },
]

export function SettingsPage() {
  const settings = useQuery({ queryKey: ['settings'], queryFn: adminApi.settings })
  return (
    <section className="max-w-4xl space-y-8">
      <h1 className="text-lg font-semibold">Settings</h1>
      {settings.error && <Notice text={errorText(settings.error)} tone="error" onClose={() => void settings.refetch()} />}
      {settings.isPending && <p className="text-sm text-muted-foreground">Loading…</p>}
      {settings.data && (
        <>
          {!settings.data.writes && (
            <Notice
              tone="error"
              text="The GitHub App is not configured: the cron cannot commit, so neither auto-approve nor followed collections run."
            />
          )}
          <AutomationForm key={JSON.stringify(settings.data.automation)} data={settings.data} />
          <LastRun data={settings.data} />
          <Collections collections={settings.data.collections} />
        </>
      )}
    </section>
  )
}

function AutomationForm({ data }: { data: SettingsData }) {
  const [form, setForm] = useState<Omit<Automation, 'since'>>({
    enabled: data.automation.enabled,
    sources: data.automation.sources,
    hours: data.automation.hours,
  })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const client = useQueryClient()
  const since = data.automation.since
  const everything = since <= '1970-01-01T00:00:00Z'

  const save = async (includeOlder = false) => {
    if (includeOlder) {
      const ok = await confirm({
        title: 'Include older pending items?',
        body: `Every unflagged pending item from the chosen sources that has waited ${form.hours} hours qualifies, not only those found after ${when(since)}. The cron approves at most 100 per run (every 4 hours).`,
        action: 'Include them',
      })
      if (!ok) return
    }
    setBusy(true)
    try {
      await adminApi.saveAutomation({ ...form, ...(includeOlder ? { includeOlder: true } : {}) })
      setNotice({ tone: 'info', text: 'Saved. The next cron run (every 4 hours, at :23) uses it.' })
      void client.invalidateQueries({ queryKey: ['settings'] })
    } catch (e) {
      setNotice({ tone: 'error', text: errorText(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 text-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Auto-approve the review queue</h2>
          <p className="text-muted-foreground">
            Pending items without a flag (NSFW?, demo, previously removed) that nobody decided on are queued for
            ingest after a while. Paid or dead games are still dropped by the ingest.
          </p>
        </div>
        <Switch
          checked={form.enabled}
          onCheckedChange={(enabled) => setForm({ ...form, enabled })}
          aria-label="Auto-approve"
        />
      </div>
      <fieldset className="mt-4 flex flex-wrap gap-4" disabled={!form.enabled}>
        <legend className="mb-1 text-xs text-muted-foreground">Sources</legend>
        {SOURCES.map((s) => (
          <label key={s.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.sources.includes(s.id)}
              onChange={(e) =>
                setForm({
                  ...form,
                  sources: e.target.checked ? [...form.sources, s.id] : form.sources.filter((x) => x !== s.id),
                })
              }
            />
            {s.label}
          </label>
        ))}
      </fieldset>
      <label className="mt-4 flex items-center gap-2">
        <span>After</span>
        <Input
          type="number"
          min={1}
          max={720}
          value={form.hours}
          disabled={!form.enabled}
          onChange={(e) => setForm({ ...form, hours: Math.round(Number(e.target.value)) || 1 })}
          className="h-8 w-20"
        />
        <span>hours without a decision</span>
      </label>
      <p className="mt-3 text-xs text-muted-foreground">
        {everything
          ? 'Applies to every pending item.'
          : `Applies to items found after ${when(since)} (switching it on starts a new baseline, so a backlog is not approved all at once).`}
      </p>
      {notice && (
        <div className="mt-3">
          <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        {form.enabled && !everything && (
          <Button variant="outline" disabled={busy} onClick={() => void save(true)}>
            Include older pending items
          </Button>
        )}
      </div>
    </div>
  )
}

function LastRun({ data }: { data: SettingsData }) {
  const run = data.lastRun
  return (
    <div className="text-sm">
      <h2 className="mb-1 text-base font-semibold">Last automatic run</h2>
      {!run ? (
        <p className="text-muted-foreground">None yet (the cron runs every 4 hours, at :23).</p>
      ) : (
        <div className="space-y-1">
          <p>
            {when(run.at)}: {plural(run.approved, 'item')} auto-approved, {plural(run.added, 'game')} from collections
            {run.review > 0 && `, ${plural(run.review, 'item')} sent to review`}
            {run.duplicates > 0 && `, ${plural(run.duplicates, 'item')} already in the catalog`} ·{' '}
            {plural(run.pages, 'collection page')} read{run.sha && ` · commit ${shortSha(run.sha)}`}
          </p>
          {run.errors.map((e) => (
            <p key={e} className="text-destructive">
              {e}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

const STATUS_TEXT: Record<number, string> = {
  0: 'itch.io unreachable',
  200: 'OK',
  404: 'not found',
  422: 'page unreadable (markup changed?)',
  429: 'rate limited',
  500: 'not found',
  503: 'rate limited',
}

function Collections({ collections }: { collections: WatchedCollection[] }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<NoticeState>(null)
  const client = useQueryClient()

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true)
    try {
      await action()
      setNotice({ tone: 'info', text: done })
      void client.invalidateQueries({ queryKey: ['settings'] })
    } catch (e) {
      setNotice({ tone: 'error', text: errorText(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="text-sm">
      <h2 className="mb-1 text-base font-semibold">Followed itch.io collections</h2>
      <p className="mb-3 text-muted-foreground">
        The cron reads them in turn (up to 30 pages per run, one a second) and queues their new free games directly.
        A game removed before, or with a flag, goes to the review queue instead; one the queue already knows is left
        to you.
      </p>
      {notice && <Notice text={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://itch.io/c/1234567/collection-name"
          aria-label="Collection to follow"
          className="max-w-xl flex-1"
        />
        <Button
          disabled={busy || !url.trim()}
          onClick={() =>
            void run(async () => {
              await adminApi.watch(url)
              setUrl('')
            }, 'Following it: the next cron run reads it.')
          }
        >
          Follow
        </Button>
      </div>
      {collections.length === 0 ? (
        <p className="text-muted-foreground">None yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">Collection</th>
              <th className="py-2 pr-3">On</th>
              <th className="py-2 pr-3">Last read</th>
              <th className="py-2 pr-3">Found / queued</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.id} className="border-b align-top last:border-0">
                <td className="py-2 pr-3">
                  <a href={`https://itch.io/c/${c.id}/${c.slug}`} target="_blank" rel="noreferrer noopener" className="font-medium hover:underline">
                    #{c.id}
                  </a>{' '}
                  <span className="text-xs text-muted-foreground">{c.slug}</span>
                </td>
                <td className="py-2 pr-3">
                  <Switch
                    checked={c.enabled === 1}
                    disabled={busy}
                    aria-label={`Read collection ${c.id}`}
                    onCheckedChange={(on) => void run(() => adminApi.toggleCollection(c.id, on), on ? 'Switched on.' : 'Switched off.')}
                  />
                </td>
                <td className="py-2 pr-3 text-xs">
                  {c.last_polled_at ? when(c.last_polled_at) : 'not yet'}
                  {c.last_status !== null && (
                    <div className="text-muted-foreground">
                      {STATUS_TEXT[c.last_status] ?? `HTTP ${c.last_status}`}
                      {c.backoff_until && ` · paused until ${when(c.backoff_until)}`}
                      {c.next_page > 1 && ` · continues at page ${c.next_page}`}
                    </div>
                  )}
                </td>
                <td className="py-2 pr-3 text-xs tabular-nums">
                  {c.last_found ?? '—'} / {c.last_added ?? '—'}
                </td>
                <td className="py-2 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Stop following collection #${c.id}?`,
                        body: 'Games already queued or added stay.',
                        action: 'Stop following',
                        destructive: true,
                      })
                      if (ok) void run(() => adminApi.unwatch(c.id), 'Stopped following it.')
                    }}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
