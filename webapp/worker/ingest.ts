/**
 * POST /api/ingest — machine submissions (the browser extension) into the
 * review queue. Replaces the extension's direct commits with a GitHub PAT.
 *
 * Auth: a Cloudflare Access service token of the "Ingest" application
 * (the client sends CF-Access-Client-Id/Secret; Access adds the JWT that
 * requireService verifies). The submitter recorded is the token's client
 * id, never something from the body.
 *
 * Body (≤ 64 KB, ≤ 150 items), with a required Idempotency-Key header:
 *   {"items": [{"url": "...", "title"?: "...", "note"?: "..."}]}  or  {"urls": ["..."]}
 * A retry with the same key and body gets the stored answer; the same key
 * with a different body is refused. Kept for 7 days.
 */
import { AccessError, requireService, type AccessEnv } from './access'
import { canonicalize } from './canonical'
import { catalogUrls, deletedGames, type DataSource } from './data'
import { ACCESS_CONFIG, missingConfig, type WorkerEnv } from './env'
import { HttpError, errorResponse, isObject, json, sha256Hex } from './http'
import { autoFlags, classify, type QueueStore } from './queue'

const MAX_BYTES = 64 * 1024
const MAX_ITEMS = 150
const KEY = /^[A-Za-z0-9_-]{8,128}$/

interface Item {
  url: string
  title: string | null
  note: string | null
}

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null
}

function parseItems(body: unknown): Item[] {
  if (!isObject(body)) throw new HttpError(400, 'invalid_body')
  const raw = Array.isArray(body.items) ? body.items : Array.isArray(body.urls) ? body.urls : null
  if (!raw || raw.length === 0) throw new HttpError(400, 'invalid_body', 'Send `items` or `urls`')
  if (raw.length > MAX_ITEMS) throw new HttpError(413, 'too_many_items', `At most ${MAX_ITEMS} items`)
  return raw.map((entry: unknown) => {
    if (typeof entry === 'string') return { url: entry, title: null, note: null }
    if (isObject(entry) && typeof entry.url === 'string') {
      return { url: entry.url, title: text(entry.title, 200), note: text(entry.note, 500) }
    }
    throw new HttpError(400, 'invalid_item')
  })
}

export interface IngestDeps {
  store: QueueStore | null
  data: DataSource
  limiter: Pick<RateLimit, 'limit'> | undefined
  /** Verifies the Access JWT; returns the service-token client id. */
  authenticate: (request: Request) => Promise<string>
}

export function accessService(env: WorkerEnv) {
  return async (request: Request): Promise<string> => {
    if (missingConfig(env, [...ACCESS_CONFIG, 'ACCESS_AUD_INGEST']).length > 0) {
      throw new HttpError(503, 'not_configured')
    }
    try {
      return (await requireService(request, env as WorkerEnv & AccessEnv)).id
    } catch (e) {
      if (e instanceof AccessError) throw new HttpError(403, 'forbidden')
      throw e
    }
  }
}

export async function handleIngest(request: Request, deps: IngestDeps): Promise<Response> {
  try {
    if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed')
    const client = await deps.authenticate(request)
    if (!deps.store) throw new HttpError(503, 'not_configured')
    if (deps.limiter && !(await deps.limiter.limit({ key: client })).success) {
      throw new HttpError(429, 'rate_limited')
    }
    const key = request.headers.get('idempotency-key') ?? ''
    if (!KEY.test(key)) throw new HttpError(400, 'idempotency_key_required')

    if (Number(request.headers.get('content-length') ?? '0') > MAX_BYTES) throw new HttpError(413, 'payload_too_large')
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_BYTES) throw new HttpError(413, 'payload_too_large')
    const bodyHash = await sha256Hex(raw)

    const previous = await deps.store.idempotent(client, key)
    if (previous) {
      if (previous.body_hash !== bodyHash) throw new HttpError(422, 'idempotency_key_reused')
      return json(JSON.parse(previous.response), 200, { 'Idempotent-Replayed': 'true' })
    }

    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      throw new HttpError(400, 'invalid_json')
    }
    const items = parseItems(body)
    const canonical = items.map((i) => canonicalize(i.url)).filter((u): u is string => u !== null)
    const [catalog, deleted, known] = await Promise.all([
      catalogUrls(deps.data),
      deletedGames(deps.data),
      deps.store.statuses(canonical),
    ])
    const results = classify(
      items.map((i) => i.url),
      { catalog: new Set(catalog.keys()), deleted, known },
    )
    const fresh = results.flatMap((r, i) =>
      r.store && r.canonical
        ? [
            {
              url: r.canonical,
              source: 'ext' as const,
              title: items[i].title,
              note: items[i].note,
              submitter: client,
              flags: autoFlags(r.outcome, items[i].title),
            },
          ]
        : [],
    )
    await deps.store.insert(fresh)
    const response = JSON.stringify({
      received: fresh.length,
      results: results.map((r) => ({ url: r.input, canonical: r.canonical, outcome: r.outcome })),
    })
    await deps.store.remember(client, key, bodyHash, response)
    return json(JSON.parse(response))
  } catch (e) {
    return errorResponse(e)
  }
}
