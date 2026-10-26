import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDataCache } from './data'
import type { WorkerEnv } from './env'
import worker from './index'
import { ORIGIN } from './test/fakes'

const SHELL = '<!doctype html><div id="root"></div>'
const BOT = 'b'.repeat(40)

function env(over: Record<string, unknown> = {}) {
  const assets = {
    fetch: vi.fn(async (req: Request) => {
      const { pathname } = new URL(req.url)
      if (pathname === '/') return new Response(SHELL, { headers: { 'content-type': 'text/html' } })
      if (pathname === '/data/urls.json') return Response.json({})
      if (pathname === '/data/index.json') return Response.json({ total_games: 0 })
      return new Response(null, { status: 404 })
    }),
  }
  const thumbs = { get: vi.fn(), put: vi.fn(), head: vi.fn() }
  return {
    ASSETS: assets,
    THUMBS: thumbs,
    SITE_ORIGIN: ORIGIN,
    TURNSTILE_SITEKEY: '0x4AAA-site',
    TURNSTILE_SECRET: 'turnstile-secret',
    BOT_GATE: 'on',
    BOT_GATE_TTL_HOURS: '48',
    GATE_SECRET: 'g'.repeat(40),
    GATE_BOT_TOKEN: BOT,
    ...over,
  } as unknown as WorkerEnv & { THUMBS: typeof thumbs }
}

const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext
const cache = { match: vi.fn(), put: vi.fn(async () => {}) }

function run(path: string, headers: Record<string, string> = {}, e: WorkerEnv = env()) {
  const request = new Request(new URL(path, ORIGIN), { headers }) as Parameters<NonNullable<typeof worker.fetch>>[0]
  return worker.fetch!(request, e, ctx)
}

beforeEach(() => {
  resetDataCache()
  cache.match.mockReset()
  vi.stubGlobal('caches', { default: cache })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.unstubAllGlobals())

describe('router, gate on', () => {
  it('answers app pages, "/" included, with the verification page', async () => {
    for (const path of ['/', '/games', '/charts?tab=quality']) {
      const res = await run(path)
      expect(res.status).toBe(200)
      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow')
      expect(await res.text()).toContain('id="gate-config"')
    }
  })

  it('refuses /img without touching the edge cache or R2', async () => {
    const e = env()
    const res = await run('/img/160/abc/original/x.png', {}, e)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'verification_required' })
    expect(cache.match).not.toHaveBeenCalled()
    expect((e as ReturnType<typeof env>).THUMBS.get).not.toHaveBeenCalled()
  })

  it('lets verified bots through to the app shell', async () => {
    expect(await (await run('/games', { 'x-fig-known-bot': BOT })).text()).toBe(SHELL)
  })

  it('gives clients that only claim to be a search crawler a 503', async () => {
    const res = await run('/games', { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' })
    expect(res.status).toBe(503)
  })

  it('keeps the API, the admin app and /data outside the gate', async () => {
    expect((await run('/api/health')).status).toBe(200)
    expect(await (await run('/api/verify')).json()).toMatchObject({ enabled: true, valid: false })
    const admin = await run('/admin/')
    expect([admin.status, admin.headers.get('content-type')]).toEqual([503, 'text/plain; charset=utf-8'])
    // A missing pack: the Worker's 404 (no-store), with CORS for the apps.
    const pack = await run('/data/pack/0123456789abcdef.bin')
    expect([pack.status, pack.headers.get('access-control-allow-origin')]).toEqual([404, '*'])
    expect(pack.headers.get('cache-control')).toBe('no-store')
  })

  it('serves the readable catalog JSON to the old apps only, never the verification page', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    const browser = await run('/data/index.json')
    expect([browser.status, browser.headers.get('access-control-allow-origin')]).toEqual([410, '*'])
    expect(await browser.json()).toMatchObject({ error: 'gone' })
    const app = await run('/data/index.json', { origin: 'tauri://localhost' })
    expect(app.status).toBe(200)
    expect(await app.json()).toEqual({ total_games: 0 })
  })
})

describe('router, gate off', () => {
  it('serves the app shell as before', async () => {
    expect(await (await run('/games', {}, env({ BOT_GATE: 'off' }))).text()).toBe(SHELL)
  })

  it('serves covers without asking for a pass', async () => {
    const e = env({ BOT_GATE: 'off' })
    const res = await run('/img/160/abc/original/x.png', {}, e)
    // Past the gate: the image handler answers (the cover is not in this empty catalog).
    expect(res.status).not.toBe(403)
  })
})

describe('rate limits', () => {
  /** The binding's behaviour for one window: the first `limit` requests per key pass. */
  function bucket(limit: number) {
    const counts = new Map<string, number>()
    return {
      limit: vi.fn(async ({ key }: RateLimitOptions) => {
        const n = (counts.get(key) ?? 0) + 1
        counts.set(key, n)
        return { success: n <= limit }
      }),
    }
  }

  function limited(over: Record<string, unknown> = {}) {
    return env({ RL_SITE: bucket(120), RL_IMG: bucket(600), RL_ADMIN: bucket(300), ...over })
  }

  const IP = { 'cf-connecting-ip': '198.51.100.20' }

  it('lets 120 requests a window through, then answers a burst with 429', async () => {
    const e = limited()
    const statuses = await Promise.all(Array.from({ length: 150 }, () => run('/api/health', IP, e).then((r) => r.status)))
    expect(statuses.filter((s) => s === 200)).toHaveLength(120)
    expect(statuses.filter((s) => s === 429)).toHaveLength(30)
    // Other clients are not affected.
    expect((await run('/api/health', { 'cf-connecting-ip': '198.51.100.21' }, e)).status).toBe(200)
  })

  it('stops a flooding client before any work: pages, API, data', async () => {
    const e = limited({ RL_SITE: bucket(0) })
    const page = await run('/games', IP, e)
    expect([page.status, page.headers.get('content-type')]).toEqual([429, 'text/html; charset=utf-8'])
    expect(page.headers.get('retry-after')).toBe('60')
    const suggest = await run('/api/suggest', IP, e)
    expect(await suggest.json()).toEqual({ error: 'rate_limited' })
    expect((await run('/data/index.json', { ...IP, origin: 'tauri://localhost' }, e)).status).toBe(429)
    expect((e as ReturnType<typeof env>).ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('limits covers on their own budget, before the gate and the edge cache', async () => {
    const e = limited({ RL_IMG: bucket(2) })
    const statuses = []
    for (let i = 0; i < 3; i++) statuses.push((await run('/img/160/abc/original/x.png', IP, e)).status)
    expect(statuses).toEqual([403, 403, 429])
    expect(cache.match).not.toHaveBeenCalled()
    // Pages still work for the same client.
    expect((await run('/games', IP, e)).status).toBe(200)
  })

  it('counts an IPv6 client by its /64', async () => {
    const e = limited({ RL_SITE: bucket(1) })
    expect((await run('/api/health', { 'cf-connecting-ip': '2001:db8:5:6::1' }, e)).status).toBe(200)
    expect((await run('/api/health', { 'cf-connecting-ip': '2001:db8:5:6:ffff::2' }, e)).status).toBe(429)
  })

  it('never limits verified bots', async () => {
    const e = limited({ RL_SITE: bucket(0) })
    const res = await run('/games', { ...IP, 'x-fig-known-bot': BOT }, e)
    expect(await res.text()).toBe(SHELL)
  })

  it('limits the admin on its own budget', async () => {
    const e = limited({ RL_ADMIN: bucket(0) })
    expect((await run('/api/admin/queue', IP, e)).status).toBe(429)
    expect((await run('/admin/', IP, e)).status).toBe(429)
    expect((await run('/api/health', IP, e)).status).toBe(200)
  })
})
