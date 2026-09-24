/**
 * Bot verification gate (web only). Until a visitor passes a Cloudflare
 * Turnstile check, app pages answer with the verification page
 * (gate-page.ts) and /img covers with 403. Passing sets an HttpOnly cookie
 * that is good for BOT_GATE_TTL_HOURS (default 48).
 *
 * Not gated: /assets, /data and the other static files (the desktop/Android
 * apps and CC BY reuse read /data; a browser only finds the bundles through
 * the gated app shell), /api/* and /admin* (Access).
 *
 * Verified bots (Cloudflare's `cf.client.bot`) pass: a zone Request Header
 * Transform Rule sends `x-fig-known-bot: <GATE_BOT_TOKEN>` for them.
 *
 * Fails open. Nothing is gated unless BOT_GATE is "on" and TURNSTILE_SITEKEY,
 * TURNSTILE_SECRET, GATE_SECRET and GATE_BOT_TOKEN (not needed on localhost)
 * are all set; `wrangler secret delete GATE_SECRET` is the instant off switch.
 *
 *   GET  /api/verify   {enabled, valid, via: 'bot'|'cookie'|null, ttl}
 *   POST /api/verify   {token} → {ttl} + Set-Cookie
 */
import { missingConfig, type WorkerEnv } from './env'
import { challengePage, crawlerUnavailable } from './gate-page'
import { HttpError, LOCAL_HOSTS, errorResponse, isObject, json, rateKey, readJson } from './http'
import { siteverify } from './turnstile'

const COOKIE = '__Host-fig_gate'
// http://localhost (wrangler dev) cannot hold a Secure cookie, so no __Host- prefix there.
const LOCAL_COOKIE = 'fig_gate'
const BOT_HEADER = 'x-fig-known-bot'
const MIN_SECRET = 32
const DEFAULT_TTL_HOURS = 48
const MAX_TTL_HOURS = 168
// A cookie issued up to this many seconds "in the future" still counts (clock drift between edges).
const CLOCK_SKEW = 300
const COOKIE_VALUE = /^v1\.(\d{10})\.([A-Za-z0-9_-]{43})$/
// Clients that say they are a search crawler get a 503 rather than the (noindex) page.
const CRAWLER_UA = /googlebot|bingbot|applebot|duckduckbot|yandex|baiduspider|coccocbot/i

export interface Gate {
  secret: string
  botToken: string
  /** Seconds a pass lasts. */
  ttl: number
  sitekey: string
  turnstileSecret: string
  siteOrigin: string
  local: boolean
}

export type PassVia = 'bot' | 'cookie'

let warned = false

/** The gate's settings, or null when it is off (then nothing is gated). */
export function gateConfig(env: WorkerEnv, url: URL): Gate | null {
  if (env.BOT_GATE !== 'on') return null
  const local = LOCAL_HOSTS.has(url.hostname)
  const missing: string[] = missingConfig(env, ['TURNSTILE_SITEKEY', 'TURNSTILE_SECRET', 'SITE_ORIGIN', 'GATE_SECRET'])
  if (!local && !env.GATE_BOT_TOKEN) missing.push('GATE_BOT_TOKEN')
  if (env.GATE_SECRET && env.GATE_SECRET.length < MIN_SECRET) missing.push('GATE_SECRET (too short)')
  if (!local && env.GATE_BOT_TOKEN && env.GATE_BOT_TOKEN.length < MIN_SECRET) missing.push('GATE_BOT_TOKEN (too short)')
  if (missing.length > 0) {
    if (!warned) console.warn(`gate: off, not configured (${missing.join(', ')})`)
    warned = true
    return null
  }
  const hours = Number(env.BOT_GATE_TTL_HOURS)
  const ttlHours = hours > 0 ? Math.min(Math.max(hours, 1), MAX_TTL_HOURS) : DEFAULT_TTL_HOURS
  return {
    secret: env.GATE_SECRET as string,
    botToken: env.GATE_BOT_TOKEN ?? '',
    ttl: Math.round(ttlHours * 3600),
    sitekey: env.TURNSTILE_SITEKEY,
    turnstileSecret: env.TURNSTILE_SECRET as string,
    siteOrigin: env.SITE_ORIGIN,
    local,
  }
}

// ── Cookie ───────────────────────────────────────────────────────────────────

const encoder = new TextEncoder()

// The imported key, cached once it exists (only resolved values are shared
// between requests, never a pending promise).
let hmac: { secret: string; key: CryptoKey } | undefined

async function macKey(secret: string): Promise<CryptoKey> {
  if (hmac?.secret === secret) return hmac.key
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
  hmac = { secret, key }
  return key
}

const macInput = (iat: number) => encoder.encode(`fig-gate|v1|${iat}`)

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

function cookieValues(request: Request, name: string): string[] {
  const header = request.headers.get('cookie') ?? ''
  const values: string[] = []
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq > 0 && part.slice(0, eq).trim() === name) values.push(part.slice(eq + 1).trim())
  }
  return values
}

/** The Set-Cookie value for a visitor who just passed. */
export async function passCookie(gate: Gate, now = Date.now()): Promise<string> {
  const iat = Math.floor(now / 1000)
  const mac = toBase64Url(await crypto.subtle.sign('HMAC', await macKey(gate.secret), macInput(iat)))
  const flags = gate.local ? 'HttpOnly; SameSite=Lax' : 'Secure; HttpOnly; SameSite=Lax'
  return `${gate.local ? LOCAL_COOKIE : COOKIE}=v1.${iat}.${mac}; Path=/; Max-Age=${gate.ttl}; ${flags}`
}

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(text)))
}

/** The request carries the verified-bot header with the right token (compared in constant time). */
export async function botPass(request: Request, token: string): Promise<boolean> {
  const sent = request.headers.get(BOT_HEADER)
  if (!sent || token.length < MIN_SECRET) return false
  const [a, b] = await Promise.all([sha256(sent), sha256(token)])
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/**
 * Whether the request has passed: as a verified bot, or with a pass cookie
 * that is still valid. `remaining` is how many seconds the pass has left.
 * The cookie holds its issue time, so lowering the TTL shortens passes
 * already given out.
 */
export async function checkPass(
  request: Request,
  gate: Gate,
  now = Date.now(),
): Promise<{ via: PassVia | null; remaining: number }> {
  if (await botPass(request, gate.botToken)) return { via: 'bot', remaining: gate.ttl }
  const nowSec = Math.floor(now / 1000)
  for (const value of cookieValues(request, gate.local ? LOCAL_COOKIE : COOKIE)) {
    const m = COOKIE_VALUE.exec(value)
    if (!m) continue
    const iat = Number(m[1])
    if (nowSec - iat >= gate.ttl || iat > nowSec + CLOCK_SKEW) continue
    const ok = await crypto.subtle.verify('HMAC', await macKey(gate.secret), fromBase64Url(m[2]), macInput(iat))
    if (ok) return { via: 'cookie', remaining: Math.min(gate.ttl, gate.ttl - (nowSec - iat)) }
  }
  return { via: null, remaining: 0 }
}

// ── Responses ────────────────────────────────────────────────────────────────

/** /img without a pass. */
export function gateRequired(): Response {
  return json({ error: 'verification_required' }, 403)
}

/** An app page request: null when it has passed, else the verification page (503 for crawler look-alikes). */
export async function gateNavigation(request: Request, gate: Gate): Promise<Response | null> {
  if ((await checkPass(request, gate)).via) return null
  if (CRAWLER_UA.test(request.headers.get('user-agent') ?? '')) return crawlerUnavailable(request)
  return challengePage(request, { sitekey: gate.sitekey, ttlHours: gate.ttl / 3600 })
}

export interface VerifyDeps {
  fetch: typeof fetch
  limiter: Pick<RateLimit, 'limit'> | undefined
  now?: () => number
}

/** GET: the caller's pass status (the SPA and the page check it). POST: Turnstile token → pass cookie. */
export async function handleVerify(request: Request, url: URL, env: WorkerEnv, deps: VerifyDeps): Promise<Response> {
  try {
    const gate = gateConfig(env, url)
    const now = deps.now?.() ?? Date.now()
    if (request.method === 'GET' || request.method === 'HEAD') {
      if (!gate) {
        // Still report the bot header, so the Transform Rule can be checked before the gate is on.
        const bot = await botPass(request, env.GATE_BOT_TOKEN ?? '')
        return json({ enabled: false, valid: true, via: bot ? 'bot' : null, ttl: 0 })
      }
      const pass = await checkPass(request, gate, now)
      return json({ enabled: true, valid: pass.via !== null, via: pass.via, ttl: pass.remaining })
    }
    if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed')
    if (!gate) throw new HttpError(503, 'unavailable')
    if (request.headers.get('origin') !== gate.siteOrigin) throw new HttpError(403, 'bad_origin')
    if (deps.limiter && !(await deps.limiter.limit({ key: rateKey(request) })).success) {
      throw new HttpError(429, 'rate_limited')
    }
    const body = await readJson(request, 4096)
    if (!isObject(body) || typeof body.token !== 'string' || !body.token || body.token.length > 2048) {
      throw new HttpError(400, 'invalid_body')
    }
    const verdict = await siteverify(
      {
        secret: gate.turnstileSecret,
        token: body.token,
        ip: request.headers.get('cf-connecting-ip') ?? '',
        action: 'gate',
        hostname: new URL(gate.siteOrigin).hostname,
      },
      deps.fetch,
    )
    if (verdict === 'unavailable') throw new HttpError(503, 'challenge_unavailable')
    if (verdict === 'rejected') throw new HttpError(403, 'challenge_failed')
    return json({ ttl: gate.ttl }, 200, { 'Set-Cookie': await passCookie(gate, now) })
  } catch (e) {
    return errorResponse(e)
  }
}
