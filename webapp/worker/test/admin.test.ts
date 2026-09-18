import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminApi, type AdminContext, type RepoOps } from '../admin'
import { resetDataCache } from '../data'
import { r2Key } from '../img'
import { QueueStore } from '../queue'
import { withQueued, withUnblocked } from '../repo'
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
  await db.batch(['candidates', 'audit_log'].map((t) => db.prepare(`DELETE FROM ${t}`)))
  store = new QueueStore(db)
})

const NOW = new Date('2026-09-18T12:00:00Z')
const THUMB = 'https://img.itch.zone/aW1n/original/cover.png'

function fakeRepo() {
  const repo = {
    queueForIngest: vi.fn(async (urls: string[]) => ({ sha: 'sha-queue', added: urls })),
    editCatalog: vi.fn(async (edits: Map<string, unknown>, removals: { url: string }[]) => ({
      sha: 'sha-edit',
      summary: { edited: edits.size, removed: removals.length },
      thumbnails: removals.length ? [THUMB] : [],
    })),
  }
  return repo satisfies RepoOps
}

function context(over: Partial<AdminContext> = {}) {
  const thumbs = { delete: vi.fn(async () => undefined) }
  const ctx: AdminContext = {
    actor: 'owner@example.com',
    store,
    data: fakeData(['https://dev.itch.io/listed'], [{ url: 'https://dev.itch.io/gone' }]),
    repo: fakeRepo(),
    thumbs,
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

describe('admin API', () => {
  it('reports the maintainer and whether writes are possible', async () => {
    expect((await call(context().ctx, 'GET', '/api/admin/me')).body).toEqual({ email: 'owner@example.com', writes: true })
    expect((await call(context({ repo: null }).ctx, 'GET', '/api/admin/me')).body.writes).toBe(false)
  })

  it('lists the queue with parsed flags and counts', async () => {
    await store.insert([{ url: 'https://dev.itch.io/a', source: 'rss', flags: ['demo'] }], NOW)
    const { body } = await call(context().ctx, 'GET', '/api/admin/queue?status=pending')
    expect(body.counts).toMatchObject({ pending: 1 })
    expect(body.items).toEqual([expect.objectContaining({ url: 'https://dev.itch.io/a', flags: ['demo'] })])
    expect((await call(context().ctx, 'GET', '/api/admin/queue?status=bogus')).status).toBe(400)
  })

  it('approves pending rows into one commit and records the decision', async () => {
    await store.insert(['a', 'b'].map((s) => ({ url: `https://dev.itch.io/${s}`, source: 'rss' as const })), NOW)
    const { ctx, repo } = context()
    const { body } = await call(ctx, 'POST', '/api/admin/queue/decide', {
      action: 'approve',
      urls: ['https://dev.itch.io/a', 'https://dev.itch.io/b', 'https://dev.itch.io/unknown'],
    })
    expect(body).toEqual({
      sha: 'sha-queue',
      approved: ['https://dev.itch.io/a', 'https://dev.itch.io/b'],
      skipped: [{ url: 'https://dev.itch.io/unknown', reason: 'not_in_queue' }],
    })
    expect(repo.queueForIngest).toHaveBeenCalledWith(['https://dev.itch.io/a', 'https://dev.itch.io/b'], [])
    expect((await store.statuses(['https://dev.itch.io/a'])).get('https://dev.itch.io/a')).toBe('queued')
    const audit = await db.prepare('SELECT actor, action, commit_sha FROM audit_log').first()
    expect(audit).toEqual({ actor: 'owner@example.com', action: 'approve', commit_sha: 'sha-queue' })
  })

  it('needs an override to bring back a game that was removed', async () => {
    await store.insert([{ url: 'https://dev.itch.io/gone', source: 'form', flags: ['previously_deleted'] }], NOW)
    const { ctx, repo } = context()
    const refused = await call(ctx, 'POST', '/api/admin/queue/decide', { action: 'approve', urls: ['https://dev.itch.io/gone'] })
    expect(refused.body.skipped).toEqual([{ url: 'https://dev.itch.io/gone', reason: 'needs_override' }])
    expect(repo.queueForIngest).not.toHaveBeenCalled()
    await call(ctx, 'POST', '/api/admin/queue/decide', { action: 'approve', urls: ['https://dev.itch.io/gone'], override: true })
    expect(repo.queueForIngest).toHaveBeenCalledWith(['https://dev.itch.io/gone'], ['https://dev.itch.io/gone'])
  })

  it('rejects rows (a permanent blocklist) without touching the repo', async () => {
    await store.insert([{ url: 'https://dev.itch.io/spam', source: 'form' }], NOW)
    const { ctx, repo } = context()
    await call(ctx, 'POST', '/api/admin/queue/decide', { action: 'reject', urls: ['https://dev.itch.io/spam'] })
    expect((await store.statuses(['https://dev.itch.io/spam'])).get('https://dev.itch.io/spam')).toBe('rejected')
    expect(repo.queueForIngest).not.toHaveBeenCalled()
  })

  it('adds and approves pasted URLs in one step', async () => {
    await store.insert([{ url: 'https://dev.itch.io/waiting', source: 'rss' }], NOW)
    await store.insert([{ url: 'https://dev.itch.io/blocked', source: 'form' }], NOW)
    await store.setStatus(['https://dev.itch.io/blocked'], 'rejected', 'x', NOW)
    const { ctx, repo } = context()
    const { body } = await call(ctx, 'POST', '/api/admin/add', {
      urls: ['https://dev.itch.io/new', 'https://dev.itch.io/listed', 'https://dev.itch.io/waiting', 'https://dev.itch.io/blocked', 'x'],
    })
    const results = body.results as { url: string | null; outcome: string; approved: boolean }[]
    expect(results.map((r) => [r.outcome, r.approved])).toEqual([
      ['queued', true],
      ['duplicate_catalog', false],
      ['duplicate_pending', true],
      ['rejected', false],
      ['invalid_url', false],
    ])
    expect(repo.queueForIngest).toHaveBeenCalledWith(['https://dev.itch.io/new', 'https://dev.itch.io/waiting'], [])
    expect((await store.get(['https://dev.itch.io/new']))[0]).toMatchObject({ source: 'admin', status: 'queued' })
  })

  it('edits only maintainer fields', async () => {
    const { ctx, repo } = context()
    const ok = await call(ctx, 'PATCH', '/api/admin/games', { url: 'https://dev.itch.io/listed', edit: { nsfw: 'Yes', notes: 'x' } })
    expect(ok.body).toEqual({ sha: 'sha-edit', edited: 1 })
    expect(repo.editCatalog).toHaveBeenCalledWith(new Map([['https://dev.itch.io/listed', { nsfw: 'Yes', notes: 'x' }]]), [])
    expect((await call(ctx, 'PATCH', '/api/admin/games', { url: 'https://dev.itch.io/listed', edit: { rating: '5' } })).status).toBe(400)
    expect((await call(ctx, 'PATCH', '/api/admin/games', { url: 'https://dev.itch.io/listed', edit: { nsfw: 'maybe' } })).status).toBe(400)
  })

  it('removes a game with a reason and deletes its resized covers', async () => {
    const { ctx, repo, thumbs } = context()
    expect((await call(ctx, 'DELETE', '/api/admin/games', { url: 'https://dev.itch.io/listed' })).status).toBe(400)
    const { body } = await call(ctx, 'DELETE', '/api/admin/games', { url: 'https://dev.itch.io/listed', reason: 'Takedown request' })
    expect(body).toEqual({ sha: 'sha-edit', removed: 1 })
    expect(repo.editCatalog).toHaveBeenCalledWith(new Map(), [{ url: 'https://dev.itch.io/listed', reason: 'Takedown request' }])
    expect(thumbs.delete).toHaveBeenCalledWith([await r2Key(160, THUMB), await r2Key(640, THUMB)])
  })

  it('restores a removed game: unblock + queue again', async () => {
    const { ctx, repo } = context()
    const { body } = await call(ctx, 'POST', '/api/admin/games/restore', { url: 'https://dev.itch.io/gone' })
    expect(body).toEqual({ sha: 'sha-queue', queued: true })
    expect(repo.queueForIngest).toHaveBeenCalledWith(['https://dev.itch.io/gone'], ['https://dev.itch.io/gone'])
    expect((await store.statuses(['https://dev.itch.io/gone'])).get('https://dev.itch.io/gone')).toBe('queued')
  })

  it('stays read-only without the GitHub App', async () => {
    await store.insert([{ url: 'https://dev.itch.io/a', source: 'rss' }], NOW)
    const { ctx } = context({ repo: null })
    const res = await call(ctx, 'POST', '/api/admin/queue/decide', { action: 'approve', urls: ['https://dev.itch.io/a'] })
    expect(res.status).toBe(503)
    expect((await store.statuses(['https://dev.itch.io/a'])).get('https://dev.itch.io/a')).toBe('pending')
  })

  it('validates bodies and routes', async () => {
    const { ctx } = context()
    expect((await call(ctx, 'POST', '/api/admin/add', { urls: [] })).status).toBe(400)
    expect((await call(ctx, 'POST', '/api/admin/add', { urls: Array(201).fill('https://dev.itch.io/a') })).status).toBe(413)
    expect((await call(ctx, 'POST', '/api/admin/nope', {})).status).toBe(404)
  })
})

describe('repo builders', () => {
  it('appends queued URLs once, in any spelling, keeping odd entries', () => {
    const current = JSON.stringify(['https://DEV.itch.io/a/', { url: 'https://dev.itch.io/obj' }], null, 4)
    const { text, added } = withQueued(current, ['https://dev.itch.io/a', 'https://dev.itch.io/b', 'https://dev.itch.io/b'])
    expect(added).toEqual(['https://dev.itch.io/b'])
    expect(JSON.parse(text)).toEqual(['https://DEV.itch.io/a/', { url: 'https://dev.itch.io/obj' }, 'https://dev.itch.io/b'])
    expect(text).toBe(JSON.stringify(JSON.parse(text), null, 4)) // json_io.dumps format
    expect(withQueued(null, ['https://dev.itch.io/x']).text).toBe('[\n    "https://dev.itch.io/x"\n]')
  })

  it('adds unblocked URLs to the sorted allow-list once', () => {
    const { text, added } = withUnblocked('["https://dev.itch.io/b"]', ['https://dev.itch.io/a', 'https://dev.itch.io/b'])
    expect(added).toBe(1)
    expect(JSON.parse(text)).toEqual(['https://dev.itch.io/a', 'https://dev.itch.io/b'])
    expect(withUnblocked(null, ['https://dev.itch.io/x']).text).toBe('[\n    "https://dev.itch.io/x"\n]')
  })
})
