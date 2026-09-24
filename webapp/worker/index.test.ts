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
const cache = { match: vi.fn(), put: vi.fn() }

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
    const data = await run('/data/nope.json')
    expect([data.status, data.headers.get('access-control-allow-origin')]).toEqual([404, '*'])
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
