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
  await db.batch(['candidates', 'feed_state', 'audit_log', 'idempotency'].map((t) => db.prepare(`DELETE FROM ${t}`)))
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
    await store.insert([{ url: url('a'), source: 'ext', note: 'again' }], hours(3))
    expect((await store.get([url('a')]))[0]).toMatchObject({
      status: 'pending',
      source: 'ext',
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
    expect(await store.reconcile(new Set([url('in')]), hours(73))).toEqual({ ingested: 1, failed: 1 })
    expect(await store.statuses([url('in'), url('slow'), url('fresh')])).toEqual(
      new Map([
        [url('in'), 'ingested'],
        [url('slow'), 'failed'],
        [url('fresh'), 'queued'],
      ]),
    )
  })

  it('purges old idempotency records and old Suggest-form notes', async () => {
    await store.remember('ext', 'key-old-0001', 'h', '{}', T0)
    await store.remember('ext', 'key-new-0001', 'h', '{}', hours(24 * 6))
    await store.insert([{ url: url('form'), source: 'form', note: 'contact me' }], T0)
    await store.insert([{ url: url('ext'), source: 'ext', note: 'kept' }], T0)
    await store.purge(hours(24 * 181))
    expect(await store.idempotent('ext', 'key-old-0001')).toBeNull()
    expect(await store.idempotent('ext', 'key-new-0001')).toBeNull() // 175 days old by then
    const notes = new Map((await store.get([url('form'), url('ext')])).map((r) => [r.url, r.note]))
    expect(notes.get(url('form'))).toBeNull()
    expect(notes.get(url('ext'))).toBe('kept')
  })

  it('keeps idempotency records per client and ignores a duplicate insert', async () => {
    await store.remember('ext-a', 'same-key-01', 'h1', '{"n":1}', T0)
    await store.remember('ext-a', 'same-key-01', 'h2', '{"n":2}', T0)
    await store.remember('ext-b', 'same-key-01', 'h3', '{"n":3}', T0)
    expect(await store.idempotent('ext-a', 'same-key-01')).toEqual({ body_hash: 'h1', response: '{"n":1}' })
    expect(await store.idempotent('ext-b', 'same-key-01')).toEqual({ body_hash: 'h3', response: '{"n":3}' })
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
