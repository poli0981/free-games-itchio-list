import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { QueueStore } from '../queue'
import { testDb } from './d1'

let db: D1Database
let dispose: () => Promise<void>
let store: QueueStore

beforeAll(async () => {
  ;({ db, dispose } = await testDb())
}, 60_000)
afterAll(() => dispose())
beforeEach(async () => {
  await db.batch(
    ['candidates', 'feed_state', 'audit_log', 'settings', 'watched_collections'].map((t) =>
      db.prepare(`DELETE FROM ${t}`),
    ),
  )
  store = new QueueStore(db)
})

const T0 = new Date('2026-09-18T00:00:00Z')
const hours = (h: number) => new Date(T0.getTime() + h * 3_600_000)
const url = (slug: string) => `https://dev.itch.io/${slug}`

describe('QueueStore', () => {
  it('stores candidates, reports statuses and lists newest first', async () => {
    await store.insert([{ url: url('a'), source: 'rss', title: 'A', flags: ['demo'] }], T0)
    await store.insert([{ url: url('b'), source: 'form', note: 'hi' }], hours(1))
    expect(await store.statuses([url('a'), url('b'), url('zzz')])).toEqual(
      new Map([
        [url('a'), 'pending'],
        [url('b'), 'pending'],
      ]),
    )
    const rows = await store.list('pending')
    expect(rows.map((r) => r.url)).toEqual([url('b'), url('a')])
    expect(JSON.parse(rows[1].flags)).toEqual(['demo'])
    expect((await store.counts()).pending).toBe(2)
  })

  it('never overwrites a live row, but reopens a failed one', async () => {
    await store.insert([{ url: url('a'), source: 'rss', title: 'Old' }], T0)
    await store.setStatus([url('a')], 'rejected', 'me@example.com', T0)
    await store.insert([{ url: url('a'), source: 'form', title: 'New' }], hours(1))
    expect((await store.get([url('a')]))[0]).toMatchObject({ status: 'rejected', source: 'rss', title: 'Old' })

    await store.setStatus([url('a')], 'failed', 'reconcile', hours(2))
    await store.insert([{ url: url('a'), source: 'admin', note: 'again' }], hours(3))
    expect((await store.get([url('a')]))[0]).toMatchObject({
      status: 'pending',
      source: 'admin',
      title: 'Old', // kept when the new submission has none
      note: 'again',
      decided_at: null,
      discovered_at: '2026-09-18T03:00:00Z',
    })
  })

  it('queries more URLs than one statement can bind', async () => {
    const urls = Array.from({ length: 250 }, (_, i) => url(`g${i}`))
    await store.insert(urls.map((u) => ({ url: u, source: 'rss' as const })), T0)
    expect((await store.statuses(urls)).size).toBe(250)
    expect((await store.get(urls)).length).toBe(250)
  })

  it('reconciles queued rows: ingested when in the catalog, failed after 3 days', async () => {
    await store.insert([url('in'), url('slow'), url('fresh')].map((u) => ({ url: u, source: 'admin' as const })), T0)
    await store.setStatus([url('in'), url('slow')], 'queued', 'me', T0)
    await store.setStatus([url('fresh')], 'queued', 'me', hours(70))
    expect(await store.reconcile(new Set([url('in')]), new Map(), hours(73))).toEqual({ ingested: 1, failed: 1 })
    expect(await store.statuses([url('in'), url('slow'), url('fresh')])).toEqual(
      new Map([
        [url('in'), 'ingested'],
        [url('slow'), 'failed'],
        [url('fresh'), 'queued'],
      ]),
    )
    const outcomes = new Map((await store.get([url('in'), url('slow')])).map((r) => [r.url, r.outcome]))
    expect(outcomes).toEqual(new Map([[url('in'), 'added'], [url('slow'), 'timeout']]))
  })

  it("settles queued rows with the pipeline's outcome, if newer than the decision", async () => {
    const urls = ['paid', 'added', 'old', 'dup'].map(url)
    await store.insert(urls.map((u) => ({ url: u, source: 'admin' as const })), T0)
    await store.setStatus(urls, 'queued', 'me', hours(10))
    const outcomes = new Map([
      [url('paid'), { outcome: 'paid', at: '2026-09-18T11:00:00Z' }],
      [url('added'), { outcome: 'added', at: '2026-09-18T11:00:00Z' }],
      [url('old'), { outcome: 'dead', at: '2026-09-17T00:00:00Z' }], // an earlier ingest of the same URL
      [url('dup'), { outcome: 'duplicate', at: '2026-09-18T11:00:00Z' }],
    ])
    expect(await store.reconcile(new Set(), outcomes, hours(12))).toEqual({ ingested: 2, failed: 1 })
    const rows = new Map((await store.get(urls)).map((r) => [r.url, [r.status, r.outcome]]))
    expect(rows).toEqual(
      new Map([
        [url('paid'), ['failed', 'paid']],
        [url('added'), ['ingested', 'added']],
        [url('old'), ['queued', null]],
        [url('dup'), ['ingested', 'duplicate']],
      ]),
    )
  })

  it('sets the status of more URLs than one statement can bind', async () => {
    const urls = Array.from({ length: 250 }, (_, i) => url(`s${i}`))
    await store.insert(urls.map((u) => ({ url: u, source: 'rss' as const })), T0)
    await store.setStatus(urls, 'queued', 'auto', T0)
    expect((await store.counts()).queued).toBe(250)
    await store.markIngested(urls.slice(0, 120), 'duplicate', T0)
    expect((await store.counts()).ingested).toBe(120)
  })

  it('lists auto-approvable rows: source, waited long enough, after the baseline, unflagged, no bad outcome', async () => {
    await store.insert(
      [
        { url: url('ok'), source: 'rss' },
        { url: url('form'), source: 'form' },
        { url: url('admin'), source: 'admin' },
        { url: url('flagged'), source: 'rss', flags: ['demo'] },
      ],
      hours(1),
    )
    await store.insert([{ url: url('young'), source: 'rss' }], hours(30))
    await store.insert([{ url: url('backlog'), source: 'rss' }], hours(-5))
    await store.insert([{ url: url('failed-before'), source: 'rss' }], hours(1))
    await db.prepare("UPDATE candidates SET outcome = 'paid' WHERE url = ?").bind(url('failed-before')).run()
    const rows = await store.autoApprovable({
      sources: ['rss', 'form'],
      before: '2026-09-18T08:00:00Z',
      since: '2026-09-18T00:00:00Z',
      limit: 10,
    })
    expect(rows.map((r) => r.url)).toEqual([url('form'), url('ok')])
    expect(await store.autoApprovable({ sources: [], before: 'z', since: '', limit: 10 })).toEqual([])
  })

  it('creates the automation settings on first read, with the baseline at that moment', async () => {
    const first = await store.automation(T0)
    expect(first).toEqual({ enabled: true, sources: ['rss', 'form'], hours: 24, since: '2026-09-18T00:00:00Z' })
    expect(await store.automation(hours(5))).toEqual(first) // not reset by later reads
    await store.putAutomation({ ...first, enabled: false, hours: 48 }, 'me', hours(6))
    expect(await store.automation(hours(7))).toMatchObject({ enabled: false, hours: 48 })
    expect(await store.lastRun()).toBeNull()
    await store.putLastRun({ approved: 3 }, hours(8))
    expect(await store.lastRun()).toEqual({ approved: 3 })
  })

  it('drops sources it no longer knows from stored settings (the retired extension)', async () => {
    const stored = { enabled: true, sources: ['rss', 'ext'], hours: 8, since: '2026-09-18T00:00:00Z' }
    await db
      .prepare("INSERT INTO settings (key, value, updated_at) VALUES ('automation', ?, ?)")
      .bind(JSON.stringify(stored), '2026-09-18T00:00:00Z')
      .run()
    expect(await store.automation(hours(1))).toEqual({ ...stored, sources: ['rss'] })
  })

  it('keeps watched collections and picks the due ones, longest-unread first', async () => {
    await store.watch('1', 'one', 'me', T0)
    await store.watch('2', 'two', 'me', hours(1))
    await store.watch('3', 'three', 'me', hours(2))
    await store.saveCollectionPoll({
      id: '1', slug: 'one', last_polled_at: '2026-09-18T05:00:00Z', last_status: 200,
      backoff_until: null, next_page: 3, last_found: 60, last_added: 2,
    })
    await store.saveCollectionPoll({
      id: '2', slug: 'two-renamed', last_polled_at: '2026-09-18T04:00:00Z', last_status: 429,
      backoff_until: '2026-09-18T12:00:00Z', next_page: 1, last_found: 0, last_added: 0,
    })
    expect((await store.collectionsDue(hours(6))).map((c) => c.id)).toEqual(['3', '1'])
    expect((await store.collectionsDue(hours(13))).map((c) => c.id)).toEqual(['3', '2', '1'])
    expect(await store.setWatched('3', false)).toBe(true)
    expect((await store.collectionsDue(hours(13))).map((c) => c.id)).toEqual(['2', '1'])
    expect((await store.collection('2'))?.slug).toBe('two-renamed')
    expect(await store.unwatch('1')).toBe(true)
    expect(await store.unwatch('1')).toBe(false)
    expect((await store.watched()).map((c) => c.id)).toEqual(['2', '3'])
  })

  it('pages through the audit log, newest first, by action', async () => {
    for (const action of ['approve', 'delete', 'approve', 'edit', 'approve']) await store.audit('me', action, 'x', null)
    const all = await store.activity({ before: null, limit: 10, actions: [] })
    expect(all.map((r) => r.action)).toEqual(['approve', 'edit', 'approve', 'delete', 'approve'])
    const approvals = await store.activity({ before: null, limit: 2, actions: ['approve'] })
    expect(approvals).toHaveLength(2)
    const older = await store.activity({ before: approvals[1].id, limit: 2, actions: ['approve'] })
    expect(older.map((r) => r.id)).toEqual([all[4].id])
  })

  it('purges Suggest-form notes after 180 days, and only those', async () => {
    await store.insert([{ url: url('form'), source: 'form', note: 'contact me' }], T0)
    await store.insert([{ url: url('recent'), source: 'form', note: 'still here' }], hours(24 * 2))
    await store.insert([{ url: url('admin'), source: 'admin', note: 'kept' }], T0)
    await store.purge(hours(24 * 181))
    const notes = new Map((await store.get([url('form'), url('recent'), url('admin')])).map((r) => [r.url, r.note]))
    expect(notes.get(url('form'))).toBeNull()
    expect(notes.get(url('recent'))).toBe('still here')
    expect(notes.get(url('admin'))).toBe('kept')
  })

  it('upserts feed state and writes the audit log', async () => {
    await store.saveFeed({ feed: 'free', last_polled_at: 'a', backoff_until: null, last_status: 200 })
    await store.saveFeed({ feed: 'free', last_polled_at: 'b', backoff_until: 'c', last_status: 429 })
    expect((await store.feeds()).get('free')).toEqual({ feed: 'free', last_polled_at: 'b', backoff_until: 'c', last_status: 429 })
    await store.audit('me@example.com', 'approve', url('a'), 'abc123')
    const row = await db.prepare('SELECT actor, action, target, commit_sha FROM audit_log').first()
    expect(row).toEqual({ actor: 'me@example.com', action: 'approve', target: url('a'), commit_sha: 'abc123' })
  })
})
