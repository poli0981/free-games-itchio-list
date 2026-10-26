import { afterEach, describe, expect, it, vi } from 'vitest'
import { unstable_readConfig } from 'wrangler'
import type { WorkerEnv } from './env'
import { RATE_PERIOD, rateBucket, rateLimit, tooManyRequests } from './ratelimit'

const ORIGIN = 'https://freeitchgames.win'
const BOT = 'b'.repeat(40)

function request(path: string, headers: Record<string, string> = {}, method = 'GET') {
  return new Request(new URL(path, ORIGIN), { headers: { 'cf-connecting-ip': '203.0.113.7', ...headers }, method })
}

function limiter(success: boolean) {
  return { limit: vi.fn<(options: RateLimitOptions) => Promise<RateLimitOutcome>>(async () => ({ success })) }
}

function env(over: Record<string, unknown> = {}) {
  return { GATE_BOT_TOKEN: BOT, ...over } as unknown as WorkerEnv
}

function check(path: string, e: WorkerEnv, headers: Record<string, string> = {}) {
  const req = request(path, headers)
  return rateLimit(req, new URL(req.url), e)
}

afterEach(() => vi.restoreAllMocks())

describe('rateBucket', () => {
  it('counts covers, the maintainer and everything else separately', () => {
    expect(rateBucket('/img/160/abc/original/x.png')).toBe('RL_IMG')
    for (const path of ['/admin', '/admin/', '/admin/assets/app.js', '/api/admin/queue']) {
      expect(rateBucket(path)).toBe('RL_ADMIN')
    }
    for (const path of ['/', '/games', '/games/x', '/api/verify', '/api/suggest', '/api/health', '/data/index.json', '/administrator', '/x.txt']) {
      expect(rateBucket(path)).toBe('RL_SITE')
    }
  })
})

describe('tooManyRequests', () => {
  function answer(path: string, method = 'GET') {
    const req = request(path, { 'accept-language': 'vi-VN,vi;q=0.9' }, method)
    return tooManyRequests(req, new URL(req.url))
  }

  it('gives app pages the 429 page: no-store, Retry-After, no script allowed', async () => {
    for (const path of ['/', '/games', '/games/some-game', '/admin', '/admin/queue']) {
      const res = answer(path)
      expect(res.status).toBe(429)
      expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
      expect(res.headers.get('retry-after')).toBe(String(RATE_PERIOD))
      expect(res.headers.get('cache-control')).toBe('no-store')
      expect(res.headers.get('x-frame-options')).toBe('DENY')
      expect(res.headers.get('content-security-policy')).toMatch(/^default-src 'none';/)
      expect(res.headers.get('content-security-policy')).not.toContain('script-src')
      const html = await res.text()
      expect(html).toContain('<html lang="vi">')
      expect(html).toContain('Quá nhiều yêu cầu')
      expect(html).not.toContain('<script')
    }
  })

  it('answers HEAD without a body', async () => {
    const res = answer('/games', 'HEAD')
    expect(res.status).toBe(429)
    expect(await res.text()).toBe('')
  })

  it('answers the API, covers and files with JSON', async () => {
    for (const path of ['/api/health', '/api/admin/queue', '/img/160/x', '/assets/x.js', '/admin/assets/app.js', '/robots.txt']) {
      const res = answer(path)
      expect(res.status).toBe(429)
      expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8')
      expect(res.headers.get('retry-after')).toBe(String(RATE_PERIOD))
      expect(res.headers.get('cache-control')).toBe('no-store')
      expect(res.headers.get('access-control-allow-origin')).toBeNull()
      expect(await res.json()).toEqual({ error: 'rate_limited' })
    }
  })

  it('keeps CORS on /data, so the apps read the 429 instead of a CORS error', async () => {
    const res = answer('/data/index.json')
    expect([res.status, res.headers.get('access-control-allow-origin')]).toEqual([429, '*'])
    expect(await res.json()).toEqual({ error: 'rate_limited' })
  })
})

describe('rateLimit', () => {
  it('counts each request against its bucket, keyed by the client address', async () => {
    const site = limiter(true)
    const img = limiter(true)
    const e = env({ RL_SITE: site, RL_IMG: img, RL_ADMIN: limiter(true) })
    expect(await check('/games', e)).toBeNull()
    expect(await check('/img/160/x', e, { 'cf-connecting-ip': '2001:db8:1:2:3:4:5:6' })).toBeNull()
    expect(site.limit).toHaveBeenCalledWith({ key: '203.0.113.7' })
    expect(img.limit).toHaveBeenCalledWith({ key: '2001:db8:1:2::/64' })
  })

  it('answers 429 once the bucket says no', async () => {
    const res = await check('/api/health', env({ RL_SITE: limiter(false) }))
    expect(res?.status).toBe(429)
    expect(await res?.json()).toEqual({ error: 'rate_limited' })
  })

  it("doesn't count verified bots, but does count a wrong bot token", async () => {
    const site = limiter(false)
    const e = env({ RL_SITE: site })
    expect(await check('/games', e, { 'x-fig-known-bot': BOT })).toBeNull()
    expect(site.limit).not.toHaveBeenCalled()
    expect((await check('/games', e, { 'x-fig-known-bot': 'x'.repeat(40) }))?.status).toBe(429)
  })

  it('fails open without a binding or when the limiter throws', async () => {
    expect(await check('/games', env())).toBeNull()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const broken = {
      limit: vi.fn(async () => {
        throw new Error('down')
      }),
    }
    expect(await check('/games', env({ RL_SITE: broken }))).toBeNull()
    expect(error).toHaveBeenCalledOnce()
  })
})

describe('wrangler.jsonc', () => {
  const NAMES = ['RL_SITE', 'RL_IMG', 'RL_ADMIN']

  interface Limit {
    name: string
    namespace_id: string
    simple: { limit: number; period: number }
  }

  function limits(envName: string | undefined): Limit[] {
    return unstable_readConfig({ config: 'wrangler.jsonc', env: envName }, { hideWarnings: true }).ratelimits as Limit[]
  }

  it.each([undefined, 'staging'])('declares every bucket with a period of RATE_PERIOD (env %s)', (envName) => {
    const byName = new Map(limits(envName).map((r) => [r.name, r]))
    for (const name of NAMES) expect(byName.get(name)?.simple.period).toBe(RATE_PERIOD)
  })

  it('gives every binding its own namespace, production and staging apart', () => {
    const ids = [undefined, 'staging'].flatMap((envName) => limits(envName).map((r) => r.namespace_id))
    expect(ids.length).toBeGreaterThanOrEqual(10)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
