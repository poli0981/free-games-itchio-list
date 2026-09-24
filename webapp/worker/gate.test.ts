import { describe, expect, it, vi } from 'vitest'
import type { WorkerEnv } from './env'
import { botPass, checkPass, gateConfig, handleVerify, passCookie, type Gate } from './gate'
import { fakeLimiter, ORIGIN } from './test/fakes'

const SECRET = 's'.repeat(40)
const BOT = 'b'.repeat(40)
const NOW = Date.UTC(2026, 8, 24, 12, 0, 0)
const HOUR = 3600 * 1000
const SITE = new URL(`${ORIGIN}/`)

function env(over: Record<string, unknown> = {}): WorkerEnv {
  return {
    SITE_ORIGIN: ORIGIN,
    TURNSTILE_SITEKEY: '0x4AAA-site',
    TURNSTILE_SECRET: 'turnstile-secret',
    BOT_GATE: 'on',
    BOT_GATE_TTL_HOURS: '48',
    GATE_SECRET: SECRET,
    GATE_BOT_TOKEN: BOT,
    ...over,
  } as unknown as WorkerEnv
}

function gate(over: Record<string, unknown> = {}, url = SITE): Gate {
  const g = gateConfig(env(over), url)
  if (!g) throw new Error('gate is off')
  return g
}

const request = (headers: Record<string, string> = {}, path = '/games') => new Request(new URL(path, ORIGIN), { headers })
/** The name=value part of a Set-Cookie header, as the browser sends it back. */
const sent = (setCookie: string) => setCookie.split(';')[0]

describe('gateConfig', () => {
  it('is on with every setting, for 48 hours', () => {
    expect(gate()).toMatchObject({ ttl: 48 * 3600, local: false, sitekey: '0x4AAA-site', siteOrigin: ORIGIN })
  })

  it.each([
    ['BOT_GATE off', { BOT_GATE: 'off' }],
    ['no Turnstile secret', { TURNSTILE_SECRET: undefined }],
    ['no site key', { TURNSTILE_SITEKEY: '' }],
    ['no GATE_SECRET', { GATE_SECRET: undefined }],
    ['a short GATE_SECRET', { GATE_SECRET: 'short' }],
    ['no GATE_BOT_TOKEN', { GATE_BOT_TOKEN: undefined }],
    ['a short GATE_BOT_TOKEN', { GATE_BOT_TOKEN: 'short' }],
  ])('is off (fails open) with %s', (_name, over) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(gateConfig(env(over), SITE)).toBeNull()
  })

  it('needs no bot token on localhost', () => {
    const local = new URL('http://localhost:8787/')
    expect(gateConfig(env({ GATE_BOT_TOKEN: undefined, SITE_ORIGIN: local.origin }), local)).toMatchObject({ local: true })
  })

  it.each([
    ['', 48],
    ['abc', 48],
    ['0', 48],
    ['-5', 48],
    ['0.5', 1],
    ['24', 24],
    ['1000', 168],
  ])('reads BOT_GATE_TTL_HOURS %j as %i hours', (value, hours) => {
    expect(gate({ BOT_GATE_TTL_HOURS: value }).ttl).toBe(hours * 3600)
  })
})

describe('pass cookie', () => {
  it('is a signed, host-only, HttpOnly cookie that passes the gate', async () => {
    const setCookie = await passCookie(gate(), NOW)
    expect(setCookie).toMatch(
      /^__Host-fig_gate=v1\.\d{10}\.[\w-]{43}; Path=\/; Max-Age=172800; Secure; HttpOnly; SameSite=Lax$/,
    )
    const pass = await checkPass(request({ cookie: `theme=dark; ${sent(setCookie)}` }), gate(), NOW + 1000)
    expect(pass).toEqual({ via: 'cookie', remaining: 48 * 3600 - 1 })
  })

  it('is plain (no Secure, no __Host-) on http://localhost', async () => {
    const local = new URL('http://localhost:8787/')
    const g = gate({ SITE_ORIGIN: local.origin }, local)
    const setCookie = await passCookie(g, NOW)
    expect(setCookie).toMatch(/^fig_gate=v1\..*; HttpOnly; SameSite=Lax$/)
    expect(setCookie).not.toContain('Secure')
    expect((await checkPass(request({ cookie: sent(setCookie) }), g, NOW)).via).toBe('cookie')
  })

  it.each([
    ['once the TTL is over', async () => sent(await passCookie(gate(), NOW)), NOW + 48 * HOUR],
    ['with a tampered signature', async () => sent(await passCookie(gate(), NOW)).replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')), NOW],
    ['with a tampered issue time', async () => sent(await passCookie(gate(), NOW)).replace(/v1\.(\d+)/, (_, t: string) => `v1.${Number(t) + 60}`), NOW],
    ['signed with another secret', async () => sent(await passCookie(gate({ GATE_SECRET: 'x'.repeat(40) }), NOW)), NOW],
    ['issued in the future', async () => sent(await passCookie(gate(), NOW + 10 * 60_000)), NOW],
    ['in another format', async () => '__Host-fig_gate=v2.1790000000.abc', NOW],
    ['under another name', async () => sent(await passCookie(gate(), NOW)).replace('__Host-fig_gate', 'fig_gate'), NOW],
  ])('does not pass %s', async (_name, cookie, at) => {
    expect(await checkPass(request({ cookie: await cookie() }), gate(), at)).toEqual({ via: null, remaining: 0 })
  })

  it('stops passing at once when the TTL is lowered', async () => {
    const cookie = sent(await passCookie(gate(), NOW))
    expect((await checkPass(request({ cookie }), gate(), NOW + 30 * HOUR)).via).toBe('cookie')
    expect((await checkPass(request({ cookie }), gate({ BOT_GATE_TTL_HOURS: '24' }), NOW + 30 * HOUR)).via).toBeNull()
  })

  it('accepts any valid copy when the cookie is sent twice', async () => {
    const cookie = `__Host-fig_gate=v1.1000000000.${'A'.repeat(43)}; ${sent(await passCookie(gate(), NOW))}`
    expect((await checkPass(request({ cookie }), gate(), NOW)).via).toBe('cookie')
  })
})

describe('verified bots', () => {
  it('pass with the token from the Transform Rule', async () => {
    expect(await checkPass(request({ 'x-fig-known-bot': BOT }), gate(), NOW)).toEqual({ via: 'bot', remaining: 48 * 3600 })
  })

  it.each([
    ['a wrong token', { 'x-fig-known-bot': 'x'.repeat(40) }],
    ['an empty header', { 'x-fig-known-bot': '' }],
    ['no header', {}],
  ])('do not pass with %s', async (_name, headers) => {
    expect((await checkPass(request(headers), gate(), NOW)).via).toBeNull()
  })

  it('never match an empty or short configured token', async () => {
    expect(await botPass(request({ 'x-fig-known-bot': '' }), '')).toBe(false)
    expect(await botPass(request({ 'x-fig-known-bot': 'abc' }), 'abc')).toBe(false)
  })
})

describe('/api/verify', () => {
  const VERIFY = new URL(`${ORIGIN}/api/verify`)
  const siteverify = (body: unknown) => vi.fn(async () => Response.json(body))
  const solved = () => siteverify({ success: true, hostname: 'freeitchgames.win', action: 'gate' })
  const post = (body: unknown = { token: 't' }, headers: Record<string, string> = {}) =>
    new Request(VERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.9', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  const deps = (over: Record<string, unknown> = {}) => ({
    fetch: solved() as unknown as typeof fetch,
    limiter: fakeLimiter(),
    now: () => NOW,
    ...over,
  })

  it('trades a Turnstile token for a pass cookie', async () => {
    const fetch = solved()
    const res = await handleVerify(post(), VERIFY, env(), deps({ fetch }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ttl: 48 * 3600 })
    expect(res.headers.get('cache-control')).toBe('no-store')
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect((await checkPass(request({ cookie: sent(setCookie) }), gate(), NOW)).via).toBe('cookie')
    const form = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData
    expect(form.get('remoteip')).toBe('203.0.113.9')
  })

  it.each([
    ['a cross-site post', post({ token: 't' }, { origin: 'https://evil.example' }), {}, 403],
    ['a post without Origin', new Request(VERIFY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"token":"t"}' }), {}, 403],
    ['a form post', post('token=t', { 'content-type': 'application/x-www-form-urlencoded' }), {}, 415],
    ['an oversized body', post({ token: 'x'.repeat(5000) }), {}, 413],
    ['no token', post({}), {}, 400],
    ['an over-long token', post({ token: 'x'.repeat(2049) }), {}, 400],
    ['the rate limit', post(), { limiter: fakeLimiter(0) }, 429],
    ['a failed challenge', post(), { fetch: siteverify({ success: false }) }, 403],
    ['a token from the Suggest form', post(), { fetch: siteverify({ success: true, hostname: 'freeitchgames.win', action: 'suggest' }) }, 403],
    ['an unreachable siteverify', post(), { fetch: vi.fn(async () => new Response(null, { status: 500 })) }, 503],
  ])('refuses %s without a cookie', async (_name, req, over, status) => {
    const res = await handleVerify(req, VERIFY, env(), deps(over))
    expect(res.status).toBe(status)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('answers 503 while the gate is off and 405 to other methods', async () => {
    expect((await handleVerify(post(), VERIFY, env({ BOT_GATE: 'off' }), deps())).status).toBe(503)
    expect((await handleVerify(new Request(VERIFY, { method: 'PUT' }), VERIFY, env(), deps())).status).toBe(405)
  })

  it('rate-limits an IPv6 client by its /64', async () => {
    const limiter = fakeLimiter()
    await handleVerify(post({ token: 't' }, { 'cf-connecting-ip': '2001:db8:1:2:3:4:5:6' }), VERIFY, env(), deps({ limiter }))
    expect(limiter.keys).toEqual(['2001:db8:1:2::/64'])
  })

  describe('GET (status)', () => {
    const status = async (headers: Record<string, string>, e = env()) =>
      (await handleVerify(new Request(VERIFY, { headers }), VERIFY, e, deps())).json()

    it('reports a valid cookie and how long it has left', async () => {
      const cookie = sent(await passCookie(gate(), NOW - HOUR))
      expect(await status({ cookie })).toEqual({ enabled: true, valid: true, via: 'cookie', ttl: 47 * 3600 })
    })

    it('reports a verified bot, and a visitor without a pass', async () => {
      expect(await status({ 'x-fig-known-bot': BOT })).toEqual({ enabled: true, valid: true, via: 'bot', ttl: 48 * 3600 })
      expect(await status({})).toEqual({ enabled: true, valid: false, via: null, ttl: 0 })
    })

    it('says the gate is off, and still reports the bot header so the rule can be checked first', async () => {
      const off = env({ GATE_SECRET: undefined })
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(await status({}, off)).toEqual({ enabled: false, valid: true, via: null, ttl: 0 })
      expect(await status({ 'x-fig-known-bot': BOT }, off)).toEqual({ enabled: false, valid: true, via: 'bot', ttl: 0 })
    })
  })
})
