import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { planCollectionItems, runAutomation, type AutomationDeps } from '../automation'
import { resetDataCache } from '../data'
import { QueueStore } from '../queue'
import { parseIngestView, type RepoOps } from '../repo'
import { testDb } from './d1'
import { fakeData } from './fakes'

let db: D1Database
let dispose: () => Promise<void>
let store: QueueStore

beforeAll(async () => {
  ;({ db, dispose } = await testDb())
}, 60_000)
afterAll(() => dispose())
beforeEach(async () => {
  resetDataCache()
  await db.batch(['candidates', 'audit_log', 'settings', 'watched_collections'].map((t) => db.prepare(`DELETE FROM ${t}`)))
  store = new QueueStore(db)
})

const T0 = new Date('2026-10-01T00:00:00Z')
const hours = (h: number) => new Date(T0.getTime() + h * 3_600_000)
const game = (slug: string) => `https://dev.itch.io/${slug}`

function fakeRepo(fail = false) {
  return {
    queueForIngest: vi.fn<(urls: string[], unblock: string[], tag?: string) => Promise<{ sha: string; added: string[] }>>(
      async (urls) => {
        if (fail) throw new Error('GitHub is down')
        return { sha: 'sha-auto', added: urls }
      },
    ),
    editCatalog: vi.fn(),
    ingestView: vi.fn(async () => parseIngestView('h', '[]', '{}', '{}')),
  } satisfies RepoOps
}

const cell = (slug: string, extra = '') =>
  `<div class="game_cell"><a class="title game_link" href="${game(slug)}">${slug}</a>${extra}</div>`

/** itch.io serving collection 7 ("picks") with the given pages of cells. */
function collection(pages: string[][]) {
  const responses = new Map<string, () => Response>()
  pages.forEach((cells, i) => {
    const page = i + 1
    responses.set(`https://itch.io/c/7/picks?format=json${page > 1 ? `&page=${page}` : ''}`, () =>
      Response.json({ page, num_items: cells.length, content: cells.join('') }),
    )
  })
  const last = pages.length + 1
  responses.set(`https://itch.io/c/7/picks?format=json&page=${last}`, () => Response.json({ page: last, num_items: 0, content: '' }))
  const fetch = vi.fn(async (input: RequestInfo | URL) => (responses.get(String(input)) ?? (() => new Response(null, { status: 500 })))())
  return { fetch: fetch as unknown as typeof globalThis.fetch, userAgent: 'test', sleep: vi.fn(async () => {}) }
}

function deps(over: Partial<AutomationDeps> = {}): AutomationDeps & { repo: ReturnType<typeof fakeRepo> } {
  return {
    store,
    data: fakeData([game('listed')], [{ url: game('gone') }]),
    repo: fakeRepo(),
    itch: collection([]),
    now: hours(30),
    ...over,
  } as AutomationDeps & { repo: ReturnType<typeof fakeRepo> }
}

describe('planCollectionItems', () => {
  it('queues only never-seen, unflagged games; removed or flagged ones go to review', () => {
    const items = ['new', 'listed', 'gone', 'failed', 'rejected', 'demo-game', 'new'].map((slug) => ({
      url: game(slug),
      title: slug === 'demo-game' ? 'Space Demo' : slug,
      image: null,
      genre: null,
      price: null,
    }))
    const plan = planCollectionItems(
      items,
      {
        catalog: new Set([game('listed')]),
        deleted: new Map([[game('gone'), { reason: 'Game became paid', deleted_at: '2026-01-01T00:00:00Z' }]]),
        known: new Map([
          [game('failed'), 'failed'],
          [game('rejected'), 'rejected'],
        ]),
      },
      '7',
    )
    expect(plan.add.map((c) => c.url)).toEqual([game('new')])
    expect(plan.add[0]).toMatchObject({ source: 'admin', submitter: 'collection:7', flags: [] })
    expect(plan.review.map((c) => [c.url, c.flags])).toEqual([
      [game('gone'), ['previously_deleted']],
      [game('demo-game'), ['demo']],
    ])
  })
})

describe('runAutomation', () => {
  it('approves unflagged items that waited, after the baseline, in one commit with collection games', async () => {
    await store.automation(T0) // the baseline: T0
    await store.insert([{ url: game('rss-old'), source: 'rss' }], hours(-1)) // before the baseline
    await store.insert([{ url: game('rss-ok'), source: 'rss' }], hours(1))
    await store.insert([{ url: game('form-ok'), source: 'form' }], hours(2))
    await store.insert([{ url: game('young'), source: 'rss' }], hours(20)) // < 24 h ago
    await store.insert([{ url: game('flagged'), source: 'rss', flags: ['nsfw_keyword'] }], hours(1))
    await store.insert([{ url: game('listed'), source: 'rss' }], hours(1)) // already in the catalog
    await store.insert([{ url: game('gone'), source: 'form' }], hours(1)) // removed before: stays for review
    await store.watch('7', 'picks', 'me', T0)
    const d = deps({ itch: collection([[cell('col-new'), cell('rss-ok'), cell('paid', '<div class="price_value">$3</div>')]]) })

    const run = await runAutomation(d)

    expect(d.repo.queueForIngest).toHaveBeenCalledTimes(1)
    expect(d.repo.queueForIngest).toHaveBeenCalledWith([game('rss-ok'), game('form-ok'), game('col-new')], [], 'auto')
    expect(run).toMatchObject({ approved: 2, added: 1, review: 0, duplicates: 1, pages: 2, sha: 'sha-auto', errors: [] })
    const statuses = await store.statuses(['rss-old', 'rss-ok', 'form-ok', 'young', 'flagged', 'listed', 'gone', 'col-new', 'paid'].map(game))
    expect(Object.fromEntries([...statuses].map(([u, s]) => [u.replace('https://dev.itch.io/', ''), s]))).toEqual({
      'rss-old': 'pending',
      'rss-ok': 'queued',
      'form-ok': 'queued',
      young: 'pending',
      flagged: 'pending',
      listed: 'ingested',
      gone: 'pending',
      'col-new': 'queued',
    })
    expect((await store.get([game('col-new')]))[0]).toMatchObject({ source: 'admin', submitter: 'collection:7', decided_by: 'auto' })
    const audit = await db.prepare('SELECT actor, action, commit_sha FROM audit_log ORDER BY id').all()
    expect(audit.results).toEqual([
      { actor: 'cron', action: 'auto_approve', commit_sha: 'sha-auto' },
      { actor: 'cron', action: 'collection_add', commit_sha: 'sha-auto' },
    ])
    expect(await store.collection('7')).toMatchObject({ last_status: 200, next_page: 1, last_found: 2, last_added: 1 })
    expect(await store.lastRun()).toMatchObject({ approved: 2, added: 1, sha: 'sha-auto' })
  })

  it('changes nothing in D1 when the commit fails, and reads the same pages again next time', async () => {
    await store.automation(T0)
    await store.insert([{ url: game('rss-ok'), source: 'rss' }], hours(1))
    await store.watch('7', 'picks', 'me', T0)
    const d = deps({ repo: fakeRepo(true), itch: collection([[cell('col-new')]]) })
    const run = await runAutomation(d)
    expect(run.errors).toEqual(['commit: GitHub is down'])
    expect([run.approved, run.added]).toEqual([0, 0])
    expect((await store.statuses([game('rss-ok')])).get(game('rss-ok'))).toBe('pending')
    expect((await store.statuses([game('col-new')])).size).toBe(0)
    expect(await store.collection('7')).toMatchObject({ next_page: 1, last_added: 0 })
    expect(await store.lastRun()).toMatchObject({ errors: ['commit: GitHub is down'] })
  })

  it('still reads collections when auto-approve is off, and backs off on a rate limit', async () => {
    const settings = await store.automation(T0)
    await store.putAutomation({ ...settings, enabled: false }, 'me', T0)
    await store.insert([{ url: game('rss-ok'), source: 'rss' }], hours(1))
    await store.watch('7', 'picks', 'me', T0)
    await store.watch('8', 'later', 'me', hours(1))
    const limited = {
      fetch: vi.fn(async () => new Response(null, { status: 429, headers: { 'retry-after': '60' } })) as unknown as typeof fetch,
      userAgent: 'test',
      sleep: async () => {},
    }
    const run = await runAutomation(deps({ itch: limited }))
    expect(run).toMatchObject({ approved: 0, added: 0, pages: 1 })
    expect((await store.statuses([game('rss-ok')])).get(game('rss-ok'))).toBe('pending')
    const first = await store.collection('7')
    expect(first).toMatchObject({ last_status: 429, backoff_until: '2026-10-02T12:00:00Z' }) // 6 h at least
    expect((await store.collection('8'))?.last_polled_at).toBeNull() // no more requests this run
  })

  it('keeps reading long collections where the last run stopped', async () => {
    await store.automation(T0)
    await store.watch('7', 'picks', 'me', T0)
    const pages = Array.from({ length: 32 }, (_, i) => [cell(`g${i}`)])
    const run = await runAutomation(deps({ itch: collection(pages) }))
    expect(run.pages).toBe(30)
    expect(run.added).toBe(30)
    expect(await store.collection('7')).toMatchObject({ next_page: 31, last_added: 30 })
  })
})
