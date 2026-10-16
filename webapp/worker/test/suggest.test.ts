import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDataCache } from '../data'
import type { WorkerEnv } from '../env'
import { QueueStore } from '../queue'
import { handleSuggest } from '../suggest'
import { testDb } from './d1'
import { fakeData, fakeLimiter, ORIGIN } from './fakes'

let db: D1Database
let dispose: () => Promise<void>
let store: QueueStore

beforeAll(async () => {
  ;({ db, dispose } = await testDb())
}, 60_000)
afterAll(() => dispose())
beforeEach(async () => {
  resetDataCache()
  await db.prepare('DELETE FROM candidates').run()
  store = new QueueStore(db)
})

const env = {
  SITE_ORIGIN: ORIGIN,
  TURNSTILE_SITEKEY: '0x4AAA-site',
  TURNSTILE_SECRET: 'secret',
} as unknown as WorkerEnv

function siteverify(success: boolean, hostname = 'freeitchgames.win', action = 'suggest') {
  return vi.fn(async () => Response.json({ success, hostname, action }))
}

function suggestRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}/api/suggest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.9', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/suggest', () => {
  const deps = (over: Partial<Parameters<typeof handleSuggest>[2]> = {}) => ({
    store,
    data: fakeData(['https://dev.itch.io/listed'], [{ url: 'https://dev.itch.io/gone' }]),
    fetch: siteverify(true) as unknown as typeof fetch,
    limiter: fakeLimiter(),
    ...over,
  })

  it('tells the page whether the form is enabled', async () => {
    const on = await handleSuggest(new Request(`${ORIGIN}/api/suggest`), env, deps())
    expect(await on.json()).toEqual({ enabled: true, sitekey: '0x4AAA-site' })
    const off = await handleSuggest(new Request(`${ORIGIN}/api/suggest`), { ...env, TURNSTILE_SECRET: undefined }, deps())
    expect(await off.json()).toEqual({ enabled: false, sitekey: null })
  })

  it('queues a new game with its note', async () => {
    const fetch = siteverify(true)
    const res = await handleSuggest(
      suggestRequest({ url: 'https://Dev.itch.io/New-Game/', note: '  cozy puzzle  ', token: 't' }),
      env,
      deps({ fetch: fetch as unknown as typeof globalThis.fetch }),
    )
    expect(await res.json()).toEqual({ status: 'received' })
    const [row] = await store.get(['https://dev.itch.io/new-game'])
    expect(row).toMatchObject({ source: 'form', note: 'cozy puzzle', submitter: 'form', status: 'pending' })
    const form = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData
    expect(form.get('remoteip')).toBe('203.0.113.9')
  })

  it('answers what is already known without storing it again', async () => {
    const listed = await handleSuggest(suggestRequest({ url: 'https://dev.itch.io/listed', token: 't' }), env, deps())
    expect(await listed.json()).toEqual({ status: 'already_listed' })
    await handleSuggest(suggestRequest({ url: 'https://dev.itch.io/twice', token: 't' }), env, deps())
    const again = await handleSuggest(suggestRequest({ url: 'https://dev.itch.io/twice', token: 't' }), env, deps())
    expect(await again.json()).toEqual({ status: 'already_suggested' })
    const gone = await handleSuggest(suggestRequest({ url: 'https://dev.itch.io/gone', token: 't' }), env, deps())
    expect(await gone.json()).toEqual({ status: 'received' })
    expect(JSON.parse((await store.get(['https://dev.itch.io/gone']))[0].flags)).toEqual(['previously_deleted'])
  })

  it.each([
    ['a failed challenge', suggestRequest({ url: 'https://dev.itch.io/x', token: 't' }), { fetch: siteverify(false) }, 403],
    ['a token for another site', suggestRequest({ url: 'https://dev.itch.io/x', token: 't' }), { fetch: siteverify(true, 'evil.example') }, 403],
    ['a token minted by the verification gate', suggestRequest({ url: 'https://dev.itch.io/x', token: 't' }), { fetch: siteverify(true, 'freeitchgames.win', 'gate') }, 403],
    ['an unreachable siteverify', suggestRequest({ url: 'https://dev.itch.io/x', token: 't' }), { fetch: vi.fn(async () => new Response(null, { status: 502 })) }, 503],
    ['a cross-site post', suggestRequest({ url: 'https://dev.itch.io/x', token: 't' }, { origin: 'https://evil.example' }), {}, 403],
    ['a non-itch URL', suggestRequest({ url: 'https://example.com/game', token: 't' }), {}, 400],
    ['an over-long note', suggestRequest({ url: 'https://dev.itch.io/x', note: 'x'.repeat(501), token: 't' }), {}, 400],
    ['the rate limit', suggestRequest({ url: 'https://dev.itch.io/x', token: 't' }), { limiter: fakeLimiter(0) }, 429],
  ])('refuses %s', async (_name, request, over, status) => {
    const res = await handleSuggest(request, env, deps(over as Parameters<typeof deps>[0]))
    expect(res.status).toBe(status)
    expect(await store.counts()).toMatchObject({ pending: 0 })
  })

  it('is unavailable until configured', async () => {
    const res = await handleSuggest(suggestRequest({ url: 'https://dev.itch.io/x', token: 't' }), env, deps({ store: null }))
    expect(res.status).toBe(503)
  })
})
