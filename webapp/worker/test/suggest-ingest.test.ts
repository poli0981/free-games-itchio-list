import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDataCache } from '../data'
import type { WorkerEnv } from '../env'
import { HttpError } from '../http'
import { handleIngest } from '../ingest'
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
  await db.batch(['candidates', 'idempotency'].map((t) => db.prepare(`DELETE FROM ${t}`)))
  store = new QueueStore(db)
})

const env = {
  SITE_ORIGIN: ORIGIN,
  TURNSTILE_SITEKEY: '0x4AAA-site',
  TURNSTILE_SECRET: 'secret',
} as unknown as WorkerEnv

function siteverify(success: boolean, hostname = 'freeitchgames.win') {
  return vi.fn(async () => Response.json({ success, hostname }))
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

describe('POST /api/ingest', () => {
  const deps = (over: Partial<Parameters<typeof handleIngest>[1]> = {}) => ({
    store,
    data: fakeData(['https://dev.itch.io/listed']),
    limiter: fakeLimiter(),
    authenticate: async () => 'ext-client.access',
    ...over,
  })
  const ingestRequest = (body: unknown, key = 'key-0000-0001') =>
    new Request(`${ORIGIN}/api/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': key },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })

  it('queues items and reports each outcome, attributed to the token', async () => {
    const res = await handleIngest(
      ingestRequest({
        items: [
          { url: 'https://dev.itch.io/fresh', title: 'Fresh Demo', note: 'from a jam' },
          { url: 'https://dev.itch.io/listed' },
          'https://DEV.itch.io/fresh/',
          'nope',
        ],
      }),
      deps(),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      received: 1,
      results: [
        { url: 'https://dev.itch.io/fresh', canonical: 'https://dev.itch.io/fresh', outcome: 'queued' },
        { url: 'https://dev.itch.io/listed', canonical: 'https://dev.itch.io/listed', outcome: 'duplicate_catalog' },
        { url: 'https://DEV.itch.io/fresh/', canonical: 'https://dev.itch.io/fresh', outcome: 'duplicate_in_request' },
        { url: 'nope', canonical: null, outcome: 'invalid_url' },
      ],
    })
    const [row] = await store.get(['https://dev.itch.io/fresh'])
    expect(row).toMatchObject({ source: 'ext', submitter: 'ext-client.access', title: 'Fresh Demo', note: 'from a jam' })
    expect(JSON.parse(row.flags)).toEqual(['demo'])
  })

  it('replays a retry with the same key and refuses the key with another body', async () => {
    const first = await handleIngest(ingestRequest({ urls: ['https://dev.itch.io/a'] }), deps())
    const again = await handleIngest(ingestRequest({ urls: ['https://dev.itch.io/a'] }), deps())
    expect(again.headers.get('idempotent-replayed')).toBe('true')
    expect(await again.json()).toEqual(await first.json())
    const other = await handleIngest(ingestRequest({ urls: ['https://dev.itch.io/b'] }), deps())
    expect(other.status).toBe(422)
  })

  it.each([
    ['no idempotency key', ingestRequest({ urls: ['https://dev.itch.io/a'] }, ''), {}, 400],
    ['too many items', ingestRequest({ urls: Array.from({ length: 151 }, (_, i) => `https://dev.itch.io/g${i}`) }), {}, 413],
    ['a body over 64 KB', ingestRequest({ urls: ['https://dev.itch.io/a'], pad: 'x'.repeat(70_000) }), {}, 413],
    ['invalid JSON', ingestRequest('{nope'), {}, 400],
    ['an empty list', ingestRequest({ items: [] }), {}, 400],
    ['the rate limit', ingestRequest({ urls: ['https://dev.itch.io/a'] }), { limiter: fakeLimiter(0) }, 429],
    [
      'a failed Access check',
      ingestRequest({ urls: ['https://dev.itch.io/a'] }),
      {
        authenticate: async () => {
          throw new HttpError(403, 'forbidden')
        },
      },
      403,
    ],
  ])('refuses %s', async (_name, request, over, status) => {
    const res = await handleIngest(request, deps(over as Parameters<typeof deps>[0]))
    expect(res.status).toBe(status)
    expect(await store.counts()).toMatchObject({ pending: 0 })
  })
})
