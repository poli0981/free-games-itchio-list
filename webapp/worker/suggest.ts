/**
 * Public "suggest a game" form: GET /api/suggest (is it enabled + Turnstile
 * site key), POST /api/suggest {url, note?, token}.
 *
 * Guards: same-origin POST, per-IP rate limit (RL_SUGGEST), Turnstile
 * siteverify (the only thing a bot cannot forge), canonical itch.io URL. A
 * suggestion only enters the review queue; the answer never says more than
 * the public catalog already shows.
 */
import { canonicalize } from './canonical'
import { catalogUrls, deletedGames, type DataSource } from './data'
import { missingConfig, type WorkerEnv } from './env'
import { HttpError, errorResponse, isObject, json, readJson } from './http'
import { autoFlags, classify, type Outcome, type QueueStore } from './queue'

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const MAX_NOTE = 500

type SuggestStatus = 'received' | 'already_listed' | 'already_suggested' | 'not_accepted'

const PUBLIC_STATUS: Record<Exclude<Outcome, 'invalid_url' | 'duplicate_in_request'>, SuggestStatus> = {
  queued: 'received',
  previously_deleted: 'received', // flagged for the maintainer
  duplicate_catalog: 'already_listed',
  duplicate_pending: 'already_suggested',
  rejected: 'not_accepted',
}

export interface SuggestDeps {
  store: QueueStore | null
  data: DataSource
  fetch: typeof fetch
  limiter: Pick<RateLimit, 'limit'> | undefined
}

function enabled(env: WorkerEnv, deps: SuggestDeps): boolean {
  return missingConfig(env, ['TURNSTILE_SECRET', 'TURNSTILE_SITEKEY', 'SITE_ORIGIN']).length === 0 && deps.store !== null
}

async function verifyTurnstile(env: WorkerEnv, deps: SuggestDeps, token: string, ip: string): Promise<boolean> {
  const form = new FormData()
  form.set('secret', env.TURNSTILE_SECRET ?? '')
  form.set('response', token)
  if (ip) form.set('remoteip', ip)
  try {
    const res = await deps.fetch(SITEVERIFY, { method: 'POST', body: form })
    const outcome = (await res.json()) as { success?: boolean; hostname?: string }
    if (!outcome.success) return false
    const expected = new URL(env.SITE_ORIGIN).hostname
    // Turnstile's test keys answer with a placeholder hostname; only local dev uses them.
    return !outcome.hostname || outcome.hostname === expected || expected === 'localhost'
  } catch {
    return false
  }
}

export async function handleSuggest(request: Request, env: WorkerEnv, deps: SuggestDeps): Promise<Response> {
  try {
    if (request.method === 'GET') {
      const on = enabled(env, deps)
      return json({ enabled: on, sitekey: on ? env.TURNSTILE_SITEKEY : null })
    }
    if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed')
    if (!enabled(env, deps) || !deps.store) throw new HttpError(503, 'unavailable')
    if (request.headers.get('origin') !== env.SITE_ORIGIN) throw new HttpError(403, 'bad_origin')

    const ip = request.headers.get('cf-connecting-ip') ?? ''
    if (deps.limiter && !(await deps.limiter.limit({ key: ip || 'unknown' })).success) {
      throw new HttpError(429, 'rate_limited')
    }
    const body = await readJson(request, 4096)
    if (!isObject(body) || typeof body.url !== 'string' || typeof body.token !== 'string') {
      throw new HttpError(400, 'invalid_body')
    }
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    if (note.length > MAX_NOTE) throw new HttpError(400, 'note_too_long')
    const url = canonicalize(body.url)
    if (!url) throw new HttpError(400, 'invalid_url')
    if (!(await verifyTurnstile(env, deps, body.token, ip))) throw new HttpError(403, 'challenge_failed')

    const [catalog, deleted, known] = await Promise.all([
      catalogUrls(deps.data),
      deletedGames(deps.data),
      deps.store.statuses([url]),
    ])
    const [result] = classify([url], { catalog: new Set(catalog.keys()), deleted, known })
    if (result.store) {
      await deps.store.insert([
        { url, source: 'form', note: note || null, submitter: 'form', flags: autoFlags(result.outcome) },
      ])
    }
    const status = PUBLIC_STATUS[result.outcome as keyof typeof PUBLIC_STATUS]
    return json({ status })
  } catch (e) {
    return errorResponse(e)
  }
}
