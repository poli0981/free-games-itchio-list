/**
 * Per-client request limits for everything that runs the Worker: the second
 * layer behind the zone's WAF rate-limiting rule (docs/operations.md §1
 * step 15). Static assets (/assets/*, /data/pack/*, …) are served without
 * running the Worker, so only the WAF rule limits those — and only the WAF
 * saves the Worker request a flood would cost.
 *
 * One `ratelimits` binding per kind of traffic (wrangler.jsonc), keyed by the
 * client's IPv4 address or IPv6 /64 (rateKey):
 *
 *   RL_IMG    /img/*                          covers (a Games page shows up to 100)
 *   RL_ADMIN  /admin, /admin/*, /api/admin/*  the maintainer (Access checks who first)
 *   RL_SITE   the rest: app pages, the public /api, the readable /data JSON, misses
 *
 * Suggest and the gate's POST keep their own, stricter limits on top
 * (RL_SUGGEST, RL_GATE). Verified bots (the gate's Transform Rule header) are
 * not counted, so a crawl never rate-limits itself out of the index. Counts
 * are approximate (the binding's design): each machine of a data centre
 * counts on its own and syncs late, so a client that keeps one connection
 * (a browser, a script with keep-alive) is held to the limit, but one that
 * opens a new connection per request is barely counted — the WAF rule is the
 * limit for floods. Fails open: a missing binding or a failing limiter lets
 * the request through.
 */
import type { WorkerEnv } from './env'
import { botPass } from './gate'
import { rateLimitedPage } from './gate-page'
import { json, rateKey } from './http'

/** `period` of every limit in wrangler.jsonc (ratelimit.test.ts checks), sent as Retry-After. */
export const RATE_PERIOD = 60

export type RateBucket = 'RL_SITE' | 'RL_IMG' | 'RL_ADMIN'

export function rateBucket(path: string): RateBucket {
  if (path.startsWith('/img/')) return 'RL_IMG'
  if (path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin/')) return 'RL_ADMIN'
  return 'RL_SITE'
}

/** The 429: JSON for the API, covers, data and files; the "too many requests" page for app pages. */
export function tooManyRequests(request: Request, url: URL): Response {
  const path = url.pathname
  const retry = { 'Retry-After': String(RATE_PERIOD) }
  // CORS on /data, so the desktop/Android apps see the 429, not a CORS error.
  if (path.startsWith('/data/')) return json({ error: 'rate_limited' }, 429, { ...retry, 'Access-Control-Allow-Origin': '*' })
  const last = path.slice(path.lastIndexOf('/') + 1)
  if (/^\/(api|img|assets)\//.test(path) || last.includes('.')) return json({ error: 'rate_limited' }, 429, retry)
  return rateLimitedPage(request, RATE_PERIOD)
}

/** Counts the request; null lets it through, else the 429 to answer with. */
export async function rateLimit(request: Request, url: URL, env: WorkerEnv): Promise<Response | null> {
  const limiter: Pick<RateLimit, 'limit'> | undefined = env[rateBucket(url.pathname)]
  if (!limiter) return null
  if (await botPass(request, env.GATE_BOT_TOKEN ?? '')) return null
  try {
    if ((await limiter.limit({ key: rateKey(request) })).success) return null
  } catch (e) {
    console.error('rate limit: limiter failed, request let through', e)
    return null
  }
  return tooManyRequests(request, url)
}
