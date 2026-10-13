import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminApi, parseAutomationInput, trackItem, type AdminContext, type RepoOps } from '../admin'
import { resetDataCache } from '../data'
import { r2Key } from '../img'
import { QueueStore } from '../queue'
import { parseIngestView, withQueued, withUnblocked, type IngestView } from '../repo'
import { testDb } from './d1'
import { fakeData, ORIGIN } from './fakes'

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

const NOW = new Date('2026-09-18T12:00:00Z')
const THUMB = 'https://img.itch.zone/aW1n/original/cover.png'
// The fake catalog (fakeData) lists these; anything else is "not in the catalog".
const LISTED = ['https://dev.itch.io/listed', 'https://dev.itch.io/second']

function fakeRepo(view: IngestView = parseIngestView('head1', '[]', '{}', '{}')) {
  const repo = {
    queueForIngest: vi.fn<(urls: string[], unblock: string[], tag?: string) => Promise<{ sha: string; added: string[] }>>(
      async (urls) => ({ sha: 'sha-queue', added: urls }),
    ),
    editCatalog: vi.fn(async (edits: Map<string, unknown>, removals: { url: string }[]) => {
      const present = (u: string) => LISTED.includes(u)
      const removed = removals.map((r) => r.url).filter(present)
      return {
        sha: 'sha-edit',
        summary: { edited: [...edits.keys()].filter(present).length, removed: removed.length },
        edited: [...edits.keys()].filter(present),
        unchanged: [],
        removed,
        missing: [...edits.keys(), ...removals.map((r) => r.url)].filter((u) => !present(u)),
        thumbnails: removed.map(() => THUMB),
      }
    }),
    ingestView: vi.fn(async () => view),
  }
  return repo satisfies RepoOps
}

/** itch.io answering collection pages from a map of URL → response. */
function fakeItch(pages: Record<string, () => Response> = {}) {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const key = String(input instanceof Request ? input.url : input)
    return pages[key]?.() ?? new Response(null, { status: 500 })
  })
  return { fetch: fetch as unknown as typeof globalThis.fetch, userAgent: 'test', sleep: async () => {} }
}

function context(over: Partial<AdminContext> = {}) {
  const thumbs = { delete: vi.fn<(keys: string[]) => Promise<undefined>>(async () => undefined) }
  const ctx: AdminContext = {
    actor: 'owner@example.com',
    store,
    data: fakeData(LISTED, [{ url: 'https://dev.itch.io/gone' }]),
    repo: fakeRepo(),
    repoName: 'owner/repo',
    thumbs,
    itch: fakeItch(),
    now: NOW,
    ...over,
  }
  return { ctx, thumbs, repo: ctx.repo as ReturnType<typeof fakeRepo> }
}

async function call(ctx: AdminContext, method: string, path: string, body?: unknown) {
  const url = new URL(path, ORIGIN)
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'content-type': 'application/json' }
  }
  const res = await adminApi(new Request(url, init), url, ctx)
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}

const game = (slug: string) => `https://dev.itch.io/${slug}`

describe('admin API', () => {
  it('reports the maintainer, whether writes are possible and the repository', async () => {
    expect((await call(context().ctx, 'GET', '/api/admin/me')).body).toEqual({
      email: 'owner@example.com',
      writes: true,
      repo: 'owner/repo',
    })
    expect((await call(context({ repo: null }).ctx, 'GET', '/api/admin/me')).body.writes).toBe(false)
  })

  it('lists the queue with parsed flags and counts', async () => {
    await store.insert([{ url: game('a'), source: 'rss', flags: ['demo'] }], NOW)
    const { body } = await call(context().ctx, 'GET', '/api/admin/queue?status=pending')
    expect(body.counts).toMatchObject({ pending: 1 })
    expect(body.items).toEqual([expect.objectContaining({ url: game('a'), flags: ['demo'], outcome: null })])
    expect((await call(context().ctx, 'GET', '/api/admin/queue?status=bogus')).status).toBe(400)
  })

  it('approves pending rows into one commit and records the decision', async () => {
    await store.insert(['a', 'b'].map((s) => ({ url: game(s), source: 'rss' as const })), NOW)
    const { ctx, repo } = context()
    const { body } = await call(ctx, 'POST', '/api/admin/queue/decide', {
      action: 'approve',
      urls: [game('a'), game('b'), game('unknown')],
    })
    expect(body).toEqual({
      sha: 'sha-queue',
      approved: [game('a'), game('b')],
      skipped: [{ url: game('unknown'), reason: 'not_in_queue' }],
      at: '2026-09-18T12:00:00Z',
    })
    expect(repo.queueForIngest).toHaveBeenCalledWith([game('a'), game('b')], [], 'admin')
    expect((await store.statuses([game('a')])).get(game('a'))).toBe('queued')
    const audit = await db.prepare('SELECT actor, action, commit_sha FROM audit_log').first()
    expect(audit).toEqual({ actor: 'owner@example.com', action: 'approve', commit_sha: 'sha-queue' })
  })

  it('needs an override to bring back a game that was removed', async () => {
    await store.insert([{ url: game('gone'), source: 'form', flags: ['previously_deleted'] }], NOW)
    const { ctx, repo } = context()
    const refused = await call(ctx, 'POST', '/api/admin/queue/decide', { action: 'approve', urls: [game('gone')] })
    expect(refused.body.skipped).toEqual([{ url: game('gone'), reason: 'needs_override' }])
    expect(repo.queueForIngest).not.toHaveBeenCalled()
    await call(ctx, 'POST', '/api/admin/queue/decide', { action: 'approve', urls: [game('gone')], override: true })
    expect(repo.queueForIngest).toHaveBeenCalledWith([game('gone')], [game('gone')], 'admin')
  })

  it('rejects rows (a permanent blocklist) without touching the repo', async () => {
    await store.insert([{ url: game('spam'), source: 'form' }], NOW)
    const { ctx, repo } = context()
    await call(ctx, 'POST', '/api/admin/queue/decide', { action: 'reject', urls: [game('spam')] })
    expect((await store.statuses([game('spam')])).get(game('spam'))).toBe('rejected')
    expect(repo.queueForIngest).not.toHaveBeenCalled()
  })

  it('adds and approves pasted URLs in one step', async () => {
    await store.insert([{ url: game('waiting'), source: 'rss' }], NOW)
    await store.insert([{ url: game('blocked'), source: 'form' }], NOW)
    await store.setStatus([game('blocked')], 'rejected', 'x', NOW)
    const { ctx, repo } = context()
    const { body } = await call(ctx, 'POST', '/api/admin/add', {
      urls: [game('new'), game('listed'), game('waiting'), game('blocked'), 'x'],
    })
    const results = body.results as { url: string | null; outcome: string; approved: boolean }[]
    expect(results.map((r) => [r.outcome, r.approved])).toEqual([
      ['queued', true],
      ['duplicate_catalog', false],
      ['duplicate_pending', true],
      ['rejected', false],
      ['invalid_url', false],
    ])
    expect(repo.queueForIngest).toHaveBeenCalledWith([game('new'), game('waiting')], [], 'admin')
    expect((await store.get([game('new')]))[0]).toMatchObject({ source: 'admin', status: 'queued' })
    expect(body.at).toBe('2026-09-18T12:00:00Z')
  })

  it('keeps the collection a pasted list came from, and ignores any other `via`', async () => {
    const { ctx } = context()
    await call(ctx, 'POST', '/api/admin/add', { urls: [game('c1')], via: 'collection:123' })
    await call(ctx, 'POST', '/api/admin/add', { urls: [game('c2')], via: '<script>' })
    const rows = new Map((await store.get([game('c1'), game('c2')])).map((r) => [r.url, r.submitter]))
    expect(rows).toEqual(
      new Map([
        [game('c1'), 'collection:123'],
        [game('c2'), 'admin'],
      ]),
    )
  })

  it('checks pasted URLs without writing anything', async () => {
    await store.insert([{ url: game('waiting'), source: 'rss' }], NOW)
    const { ctx, repo } = context()
    const { body } = await call(ctx, 'POST', '/api/admin/check', {
      urls: [game('new'), game('listed'), game('waiting'), game('gone'), 'x'],
    })
    expect((body.results as { outcome: string; status: string | null }[]).map((r) => [r.outcome, r.status])).toEqual([
      ['queued', null],
      ['duplicate_catalog', null],
      ['duplicate_pending', 'pending'],
      ['previously_deleted', null],
      ['invalid_url', null],
    ])
    expect(repo.queueForIngest).not.toHaveBeenCalled()
    expect((await store.counts()).pending).toBe(1)
  })

  it("tracks queued games through the pipeline's view", async () => {
    const view = parseIngestView(
      'head9',
      JSON.stringify(['https://DEV.itch.io/waiting/']),
      JSON.stringify({ [game('waiting')]: { attempts: 1, last_error: 'error: HTTP 500' } }),
      JSON.stringify({
        [game('paid')]: { outcome: 'paid', at: '2026-09-18T12:30:00Z' },
        [game('new')]: { outcome: 'added', at: '2026-09-18T12:30:00Z' },
        [game('ancient')]: { outcome: 'dead', at: '2026-01-01T00:00:00Z' },
      }),
    )
    const { ctx } = context({ repo: fakeRepo(view) })
    const { body } = await call(ctx, 'POST', '/api/admin/track', {
      urls: [game('waiting'), game('paid'), game('new'), game('listed'), game('ancient'), 'nope'],
      since: '2026-09-18T12:00:00Z',
    })
    expect(body.head).toBe('head9')
    expect(body.items).toEqual([
      { url: game('waiting'), state: 'waiting', attempts: 1, error: 'error: HTTP 500' },
      { url: game('paid'), state: 'dropped', outcome: 'paid', at: '2026-09-18T12:30:00Z' },
      { url: game('new'), state: 'added', outcome: 'added', at: '2026-09-18T12:30:00Z' },
      { url: game('listed'), state: 'added' },
      { url: game('ancient'), state: 'unknown' }, // an outcome from before this batch
    ])
    expect(trackItem(game('x'), view, new Set(), '')).toEqual({ url: game('x'), state: 'unknown' })
    expect((await call(context({ repo: null }).ctx, 'POST', '/api/admin/track', { urls: [game('a')] })).status).toBe(503)
  })

  it('edits only maintainer fields', async () => {
    const { ctx, repo } = context()
    const ok = await call(ctx, 'PATCH', '/api/admin/games', { url: game('listed'), edit: { nsfw: 'Yes', notes: 'x' } })
    expect(ok.body).toEqual({ sha: 'sha-edit', edited: 1 })
    expect(repo.editCatalog).toHaveBeenCalledWith(new Map([[game('listed'), { nsfw: 'Yes', notes: 'x' }]]), [])
    expect((await call(ctx, 'PATCH', '/api/admin/games', { url: game('listed'), edit: { rating: '5' } })).status).toBe(400)
    expect((await call(ctx, 'PATCH', '/api/admin/games', { url: game('listed'), edit: { nsfw: 'maybe' } })).status).toBe(400)
  })

  it('removes a game with a reason and deletes its resized covers', async () => {
    const { ctx, repo, thumbs } = context()
    expect((await call(ctx, 'DELETE', '/api/admin/games', { url: game('listed') })).status).toBe(400)
    const { body } = await call(ctx, 'DELETE', '/api/admin/games', { url: game('listed'), reason: 'Takedown request' })
    expect(body).toEqual({ sha: 'sha-edit', removed: 1 })
    expect(repo.editCatalog).toHaveBeenCalledWith(new Map(), [{ url: game('listed'), reason: 'Takedown request' }])
    expect(thumbs.delete).toHaveBeenCalledWith([await r2Key(160, THUMB), await r2Key(640, THUMB)])
    expect((await call(ctx, 'DELETE', '/api/admin/games', { url: game('absent'), reason: 'x' })).status).toBe(404)
  })

  it('keeps the removal and its audit row when deleting the covers fails', async () => {
    const thumbs = {
      delete: vi.fn(async () => {
        throw new Error('R2 down')
      }),
    }
    const { ctx } = context({ thumbs })
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { status, body } = await call(ctx, 'DELETE', '/api/admin/games', { url: game('listed'), reason: 'Gone' })
    errors.mockRestore()
    expect(status).toBe(200)
    expect(body).toEqual({ sha: 'sha-edit', removed: 1, warnings: ['covers_failed'] })
    expect(await db.prepare('SELECT action, target FROM audit_log').first()).toEqual({ action: 'delete', target: game('listed') })
  })

  it('removes up to 100 games in one commit, with a result per URL', async () => {
    const { ctx, repo, thumbs } = context()
    const { body } = await call(ctx, 'POST', '/api/admin/games/remove', {
      urls: [game('listed'), 'https://DEV.itch.io/second/', game('absent'), 'not a url', game('listed')],
      reason: '  Duplicate of another entry  ',
    })
    expect(body).toEqual({
      sha: 'sha-edit',
      removed: [game('listed'), game('second')],
      notFound: [game('absent')],
      invalid: ['not a url'],
      covers: { deleted: 4, failed: 0 },
      warnings: [],
    })
    expect(repo.editCatalog).toHaveBeenCalledTimes(1)
    expect(repo.editCatalog.mock.calls[0][1]).toEqual(
      ['listed', 'second', 'absent'].map((s) => ({ url: game(s), reason: 'Duplicate of another entry' })),
    )
    expect(thumbs.delete).toHaveBeenCalledTimes(1)
    const audit = await db.prepare('SELECT action, target, detail FROM audit_log').first()
    expect(audit).toEqual({
      action: 'delete',
      target: `${game('listed')} ${game('second')}`,
      detail: 'Duplicate of another entry',
    })
    const many = Array.from({ length: 101 }, (_, i) => game(`g${i}`))
    expect((await call(ctx, 'POST', '/api/admin/games/remove', { urls: many, reason: 'x' })).status).toBe(413)
    expect((await call(ctx, 'POST', '/api/admin/games/remove', { urls: [game('listed')], reason: ' ' })).status).toBe(400)
    const long = 'x'.repeat(201)
    expect((await call(ctx, 'POST', '/api/admin/games/remove', { urls: [game('listed')], reason: long })).status).toBe(400)
  })

  it('edits up to 100 games in one commit', async () => {
    const { ctx, repo } = context()
    const edit = (url: string, e: Record<string, string>) => ({ url, edit: e })
    const { body } = await call(ctx, 'PATCH', '/api/admin/games/bulk', {
      edits: [edit(game('listed'), { nsfw: 'Yes' }), edit(game('second'), { nsfw: 'Yes' }), edit(game('absent'), { nsfw: 'Yes' })],
    })
    expect(body).toEqual({
      sha: 'sha-edit',
      edited: [game('listed'), game('second')],
      unchanged: [],
      notFound: [game('absent')],
    })
    expect(repo.editCatalog).toHaveBeenCalledTimes(1)
    expect(await db.prepare('SELECT action, detail FROM audit_log').first()).toEqual({ action: 'edit', detail: '{"nsfw":"Yes"}' })
    const tooMany = Array.from({ length: 101 }, (_, i) => edit(game(`g${i}`), { nsfw: 'No' }))
    expect((await call(ctx, 'PATCH', '/api/admin/games/bulk', { edits: tooMany })).status).toBe(413)
    const twice = [edit(game('listed'), { nsfw: 'No' }), edit('https://DEV.itch.io/listed/', { nsfw: 'Yes' })]
    expect((await call(ctx, 'PATCH', '/api/admin/games/bulk', { edits: twice })).status).toBe(400)
    expect((await call(ctx, 'PATCH', '/api/admin/games/bulk', { edits: [edit(game('listed'), { rating: '5' })] })).status).toBe(400)
    expect((await call(ctx, 'PATCH', '/api/admin/games/bulk', { edits: [edit(game('listed'), {})] })).status).toBe(400)
  })

  it('lists the activity newest first, by action, page by page', async () => {
    for (const action of ['approve', 'delete', 'edit']) await store.audit('owner@example.com', action, game('a'), 'sha')
    const { ctx } = context()
    const first = await call(ctx, 'GET', '/api/admin/activity?limit=2')
    expect((first.body.items as { action: string }[]).map((i) => i.action)).toEqual(['edit', 'delete'])
    const next = await call(ctx, 'GET', `/api/admin/activity?limit=2&before=${first.body.next}`)
    expect((next.body.items as { action: string }[]).map((i) => i.action)).toEqual(['approve'])
    expect(next.body.next).toBeNull()
    const deletes = await call(ctx, 'GET', '/api/admin/activity?actions=delete,DROP%20TABLE')
    expect((deletes.body.items as { action: string }[]).map((i) => i.action)).toEqual(['delete'])
  })

  it('reads and changes the automation settings', async () => {
    const { ctx } = context()
    const first = await call(ctx, 'GET', '/api/admin/settings')
    expect(first.body).toEqual({
      automation: { enabled: true, sources: ['rss', 'form'], hours: 24, since: '2026-09-18T12:00:00Z' },
      lastRun: null,
      collections: [],
      writes: true,
    })
    const off = await call(ctx, 'PUT', '/api/admin/settings', { automation: { enabled: false, sources: ['rss'], hours: 48 } })
    expect(off.body.automation).toEqual({ enabled: false, sources: ['rss'], hours: 48, since: '2026-09-18T12:00:00Z' })
    const later = context({ now: new Date('2026-09-20T00:00:00Z') }).ctx
    const on = await call(later, 'PUT', '/api/admin/settings', { automation: { enabled: true, sources: ['rss'], hours: 48 } })
    expect((on.body.automation as { since: string }).since).toBe('2026-09-20T00:00:00Z') // on again: a new baseline
    const older = await call(later, 'PUT', '/api/admin/settings', {
      automation: { enabled: true, sources: ['rss', 'form'], hours: 12, includeOlder: true },
    })
    expect((older.body.automation as { since: string }).since).toBe('1970-01-01T00:00:00Z')
    for (const bad of [
      { enabled: 'yes', sources: [], hours: 1 },
      { enabled: true, sources: ['admin'], hours: 1 },
      { enabled: true, sources: ['rss', 'rss'], hours: 1 },
      { enabled: true, sources: [], hours: 0 },
      { enabled: true, sources: [], hours: 1.5 },
    ]) {
      expect((await call(later, 'PUT', '/api/admin/settings', { automation: bad })).status).toBe(400)
    }
    expect(await db.prepare("SELECT count(*) AS n FROM audit_log WHERE action = 'settings'").first()).toEqual({ n: 3 })
    expect(() => parseAutomationInput(null, { enabled: true, sources: [], hours: 1, since: '' }, NOW)).toThrow()
  })

  it('reads an itch.io collection and follows one', async () => {
    const page = (n: number, content: string, count = 1) => () => Response.json({ page: n, num_items: count, content })
    const cell = (slug: string, price = '') =>
      `<div class="game_cell" data-game_id="1"><a class="title game_link" href="${game(slug)}">${slug}</a>${price}</div>`
    const itch = fakeItch({
      'https://itch.io/c/42/free-picks?format=json': page(1, cell('one') + cell('paid', '<div class="price_value">$5</div>'), 2),
      'https://itch.io/c/42/free-picks?format=json&page=2': page(2, '', 0),
      'https://itch.io/c/42/collection?format=json': () =>
        new Response(null, { status: 302, headers: { location: 'https://itch.io/c/42/free-picks' } }),
      'https://itch.io/c/42/whatever?format=json': () =>
        new Response(null, { status: 302, headers: { location: 'https://itch.io/c/42/free-picks' } }),
    })
    const { ctx } = context({ itch })
    const read = await call(ctx, 'POST', '/api/admin/collections/read', { url: 'https://itch.io/c/42' })
    expect(read.body).toEqual({
      collection: { id: '42', slug: 'free-picks', url: 'https://itch.io/c/42/free-picks' },
      items: [
        { url: game('one'), title: 'one', image: null, genre: null, price: null },
        { url: game('paid'), title: 'paid', image: null, genre: null, price: '$5' },
      ],
      pages: 1,
      nextPage: null,
    })
    const watched = await call(ctx, 'POST', '/api/admin/collections', { url: 'itch.io/c/42/whatever' })
    expect(watched.body.collection).toMatchObject({ id: '42', slug: 'free-picks', enabled: 1, next_page: 1 })
    expect((await call(ctx, 'POST', '/api/admin/collections', { url: 'https://itch.io/c/42/free-picks' })).status).toBe(409)
    const toggled = await call(ctx, 'PATCH', '/api/admin/collections', { id: '42', enabled: false })
    expect(toggled.body.collection).toMatchObject({ enabled: 0 })
    expect((await call(ctx, 'GET', '/api/admin/settings')).body.collections).toHaveLength(1)
    expect((await call(ctx, 'DELETE', '/api/admin/collections', { id: '42' })).body).toEqual({ removed: true })
    expect((await call(ctx, 'DELETE', '/api/admin/collections', { id: '42' })).status).toBe(404)
    expect((await call(ctx, 'POST', '/api/admin/collections/read', { url: 'https://itch.io/games/free' })).status).toBe(400)
    const missing = await call(ctx, 'POST', '/api/admin/collections/read', { url: 'https://itch.io/c/7/nope' })
    expect([missing.status, missing.body.error]).toEqual([404, 'collection_unavailable'])
    const actions = await db.prepare('SELECT action FROM audit_log ORDER BY id').all<{ action: string }>()
    expect(actions.results.map((r) => r.action)).toEqual(['collection_watch', 'collection_toggle', 'collection_unwatch'])
  })

  it('restores a removed game: unblock + queue again', async () => {
    const { ctx, repo } = context()
    const { body } = await call(ctx, 'POST', '/api/admin/games/restore', { url: game('gone') })
    expect(body).toEqual({ sha: 'sha-queue', queued: true, at: '2026-09-18T12:00:00Z' })
    expect(repo.queueForIngest).toHaveBeenCalledWith([game('gone')], [game('gone')], 'admin')
    expect((await store.statuses([game('gone')])).get(game('gone'))).toBe('queued')
  })

  it('stays read-only without the GitHub App', async () => {
    await store.insert([{ url: game('a'), source: 'rss' }], NOW)
    const { ctx } = context({ repo: null })
    const res = await call(ctx, 'POST', '/api/admin/queue/decide', { action: 'approve', urls: [game('a')] })
    expect(res.status).toBe(503)
    expect((await store.statuses([game('a')])).get(game('a'))).toBe('pending')
  })

  it('validates bodies and routes', async () => {
    const { ctx } = context()
    expect((await call(ctx, 'POST', '/api/admin/add', { urls: [] })).status).toBe(400)
    expect((await call(ctx, 'POST', '/api/admin/add', { urls: Array(201).fill(game('a')) })).status).toBe(413)
    expect((await call(ctx, 'POST', '/api/admin/nope', {})).status).toBe(404)
    expect((await call(ctx, 'GET', '/api/admin/nope')).status).toBe(404)
  })
})

describe('repo builders', () => {
  it('appends queued URLs once, in any spelling, keeping odd entries', () => {
    const current = JSON.stringify(['https://DEV.itch.io/a/', { url: 'https://dev.itch.io/obj' }], null, 4)
    const { text, added } = withQueued(current, [game('a'), game('b'), game('b')])
    expect(added).toEqual([game('b')])
    expect(JSON.parse(text)).toEqual(['https://DEV.itch.io/a/', { url: 'https://dev.itch.io/obj' }, game('b')])
    expect(text).toBe(JSON.stringify(JSON.parse(text), null, 4)) // json_io.dumps format
    expect(withQueued(null, [game('x')]).text).toBe('[\n    "https://dev.itch.io/x"\n]')
  })

  it('adds unblocked URLs to the sorted allow-list once', () => {
    const { text, added } = withUnblocked('["https://dev.itch.io/b"]', [game('a'), game('b')])
    expect(added).toBe(1)
    expect(JSON.parse(text)).toEqual([game('a'), game('b')])
    expect(withUnblocked(null, [game('x')]).text).toBe('[\n    "https://dev.itch.io/x"\n]')
  })

  it("reads the pipeline's files defensively", () => {
    const view = parseIngestView(
      'h',
      JSON.stringify(['https://DEV.itch.io/a/', { url: 'https://dev.itch.io/b' }, 7, 'junk']),
      '{not json',
      JSON.stringify({ [game('c')]: { outcome: 'paid', at: 't' }, [game('d')]: 'bad' }),
    )
    expect([...view.queued]).toEqual([game('a'), game('b')])
    expect(view.attempts.size).toBe(0)
    expect([...view.outcomes]).toEqual([[game('c'), { outcome: 'paid', at: 't' }]])
    expect(parseIngestView('h', null, null, null).queued.size).toBe(0)
  })
})
