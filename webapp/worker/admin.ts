/**
 * Maintainer-only admin: the JSON API under /api/admin/* and the admin app
 * shell at /admin. Both sit behind the Cloudflare Access "Admin" application
 * and re-verify its JWT here (access.ts): the edge login alone is not trusted.
 *
 *   GET    /api/admin/me                 who am I, what is configured
 *   GET    /api/admin/queue?status=…     review queue (+ counts per status)
 *   POST   /api/admin/queue/decide       {urls, action: approve|reject, override?}
 *   POST   /api/admin/check              {urls} — classify only, nothing is written
 *   POST   /api/admin/add                {urls, override?, via?} — add + approve at once
 *   POST   /api/admin/track              {urls, since?} — how queued games' ingest went
 *   PATCH  /api/admin/games              {url, edit: {safe_virus?, notes?, nsfw?}}
 *   PATCH  /api/admin/games/bulk         {edits: [{url, edit}]} — ≤ 100, one commit
 *   DELETE /api/admin/games              {url, reason}
 *   POST   /api/admin/games/remove       {urls, reason} — ≤ 100, one commit
 *   POST   /api/admin/games/restore      {url} — un-delete: unblock + queue again
 *   GET    /api/admin/activity?before&limit&actions   the audit log, newest first
 *   GET    /api/admin/settings           auto-approve rules, last automatic run, watched collections
 *   PUT    /api/admin/settings           {automation: {enabled, sources, hours, includeOlder?}}
 *   POST   /api/admin/collections/read   {url, page?} — games of an itch.io collection
 *   POST   /api/admin/collections        {url} — follow a collection (the cron queues its new games)
 *   PATCH  /api/admin/collections        {id, enabled}
 *   DELETE /api/admin/collections        {id}
 *
 * Approving commits the URLs to scripts/temp_link.json (GitHub App,
 * verified commit); that push starts the ingest workflow, which scrapes and
 * adds the games. The maintainer's email is recorded only in the D1 audit
 * log, never in the public repository.
 */
import { AccessError, requireMaintainer, type AccessEnv } from './access'
import { canonicalize } from './canonical'
import { validateEdit, type FieldEdit } from './catalog'
import { collectionUrl, parseCollectionUrl, readCollection, type ReadError, type ReadOptions } from './collections'
import { catalogUrls, deletedGames, type DataSource } from './data'
import { ACCESS_CONFIG, missingConfig, type WorkerEnv } from './env'
import { GitHubError } from './github'
import { HttpError, LOCAL_HOSTS, SECURITY_HEADERS, errorResponse, isObject, json, readJson } from './http'
import { r2Key } from './img'
import { COLLECTION_PAGES_PER_READ, MAX_BULK, MAX_REASON, MAX_TRACK_URLS, MAX_URLS, MAX_WATCHED } from './limits'
import {
  AUTOMATION_SOURCES,
  autoFlags,
  classify,
  isoSeconds,
  POSITIVE_OUTCOMES,
  type AutomationSettings,
  type CandidateRow,
  type CandidateSource,
  type CandidateStatus,
  type QueueStore,
} from './queue'
import { repoOps, type IngestView, type RepoOps } from './repo'
import { trimEnd } from './text'

const STATUSES: readonly CandidateStatus[] = ['pending', 'rejected', 'queued', 'ingested', 'failed']
const THUMB_WIDTHS = [160, 640]
const BODY_LIMIT = 64 * 1024
// A bulk edit carries up to 100 notes of up to 2,000 characters.
const BULK_EDIT_BODY_LIMIT = 256 * 1024
/** The theme script in admin/index.html (`npm test` checks this hash against the file). */
const THEME_SCRIPT_HASH = "'sha256-1TW/oHMv+d0WGXpvTvbJrBrVPRC4+bNYqNsCmE5ECCQ='"

// The admin app loads only its own bundle; cover images come straight from
// itch.io (candidates are not in the catalog yet, so /img won't serve them).
export const ADMIN_CSP = [
  "default-src 'self'",
  // The zone's Web Analytics setting injects the beacon into every HTML
  // response, this page included; without these it only logs a CSP error.
  `script-src 'self' ${THEME_SCRIPT_HASH} https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://img.itch.zone",
  "connect-src 'self' https://cloudflareinsights.com",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export type { RepoOps }

export interface AdminContext {
  actor: string
  store: QueueStore
  data: DataSource
  /** null when the GitHub App is not configured: read-only admin. */
  repo: RepoOps | null
  /** "owner/name" of the data repository (commit links in the admin), when known. */
  repoName?: string | null
  thumbs: Pick<R2Bucket, 'delete'>
  /** itch.io access for reading collections. */
  itch: Pick<ReadOptions, 'fetch' | 'userAgent' | 'sleep'>
  now: Date
}

async function maintainer(request: Request, env: WorkerEnv): Promise<string> {
  // `wrangler dev` only: Access does not run on localhost. Set DEV_ADMIN_EMAIL
  // in .dev.vars; it is ignored for every other host.
  const url = new URL(request.url)
  if (env.DEV_ADMIN_EMAIL && LOCAL_HOSTS.has(url.hostname)) {
    // Same cross-site-request guard as requireMaintainer: another site open in
    // the browser must not be able to drive a local admin.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.get('origin') !== url.origin) {
      throw new HttpError(403, 'forbidden')
    }
    return env.DEV_ADMIN_EMAIL
  }
  const missing = missingConfig(env, [...ACCESS_CONFIG, 'ACCESS_AUD_ADMIN', 'ADMIN_EMAILS'])
  if (missing.length > 0) {
    console.error(`admin: not configured (${missing.join(', ')})`)
    throw new HttpError(503, 'not_configured')
  }
  try {
    return (await requireMaintainer(request, env as WorkerEnv & AccessEnv)).id
  } catch (e) {
    if (e instanceof AccessError) throw new HttpError(403, 'forbidden')
    throw e
  }
}

function urlList(value: unknown, max: number): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new HttpError(400, 'invalid_body', '`urls` must be a non-empty array')
  if (value.length > max) throw new HttpError(413, 'too_many_urls', `At most ${max} URLs per request`)
  if (!value.every((u) => typeof u === 'string' && u.length <= 500)) throw new HttpError(400, 'invalid_body')
  return value as string[]
}

function gameUrl(value: unknown): string {
  const url = typeof value === 'string' ? canonicalize(value) : null
  if (!url) throw new HttpError(400, 'invalid_url')
  return url
}

function needRepo(ctx: AdminContext): RepoOps {
  if (!ctx.repo) throw new HttpError(503, 'github_not_configured')
  return ctx.repo
}

function reasonOf(value: unknown): string {
  const reason = typeof value === 'string' ? value.trim() : ''
  if (!reason || reason.length > MAX_REASON) {
    throw new HttpError(400, 'invalid_reason', `A reason (≤ ${MAX_REASON} characters) is required`)
  }
  return reason
}

function parseFlags(row: CandidateRow): string[] {
  try {
    const flags: unknown = JSON.parse(row.flags)
    return Array.isArray(flags) ? flags.filter((f): f is string => typeof f === 'string') : []
  } catch {
    return []
  }
}

interface Skipped {
  url: string
  reason: string
}

/**
 * Queue candidate rows for ingest. A game that was removed from the catalog
 * before (it is in the deleted log) needs `override`: approving it also
 * unblocks it, or the ingest workflow would skip it again.
 */
async function approve(ctx: AdminContext, urls: string[], override: boolean) {
  const rows = new Map((await ctx.store.get(urls)).map((r) => [r.url, r]))
  const deleted = await deletedGames(ctx.data)
  const approved: string[] = []
  const skipped: Skipped[] = []
  for (const url of urls) {
    const row = rows.get(url)
    if (!row) skipped.push({ url, reason: 'not_in_queue' })
    else if (row.status === 'queued' || row.status === 'ingested') skipped.push({ url, reason: `already_${row.status}` })
    else if (!override && (deleted.has(url) || parseFlags(row).includes('previously_deleted'))) {
      skipped.push({ url, reason: 'needs_override' })
    } else approved.push(url)
  }
  if (approved.length === 0) return { sha: null, approved, skipped }
  const { sha } = await needRepo(ctx).queueForIngest(approved, override ? approved : [], 'admin')
  await ctx.store.setStatus(approved, 'queued', ctx.actor, ctx.now)
  await ctx.store.audit(ctx.actor, override ? 'approve_override' : 'approve', approved.join(' '), sha)
  return { sha, approved, skipped }
}

async function listQueue(url: URL, ctx: AdminContext): Promise<Response> {
  const status = (url.searchParams.get('status') ?? 'pending') as CandidateStatus
  if (!STATUSES.includes(status)) throw new HttpError(400, 'invalid_status')
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 200, 1), 500)
  const [counts, rows] = await Promise.all([ctx.store.counts(), ctx.store.list(status, limit)])
  return json({ counts, items: rows.map((r) => ({ ...r, flags: parseFlags(r) })) })
}

async function decide(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const urls = urlList(body.urls, MAX_URLS).map(gameUrl)
  if (body.action === 'reject') {
    await ctx.store.setStatus(urls, 'rejected', ctx.actor, ctx.now)
    await ctx.store.audit(ctx.actor, 'reject', urls.join(' '), null)
    return json({ rejected: urls })
  }
  if (body.action !== 'approve') throw new HttpError(400, 'invalid_action')
  return json({ ...(await approve(ctx, urls, body.override === true)), at: isoSeconds(ctx.now) })
}

/** Classify pasted URLs against the published catalog, the deleted log and the queue. */
async function classifyInputs(ctx: AdminContext, inputs: string[]) {
  const canonical = inputs.map((u) => canonicalize(u)).filter((u): u is string => u !== null)
  const [catalog, deleted, known] = await Promise.all([
    catalogUrls(ctx.data),
    deletedGames(ctx.data),
    ctx.store.statuses(canonical),
  ])
  return { results: classify(inputs, { catalog: new Set(catalog.keys()), deleted, known }), known }
}

async function check(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const { results, known } = await classifyInputs(ctx, urlList(body.urls, MAX_URLS))
  return json({
    results: results.map((r) => ({
      input: r.input,
      url: r.canonical,
      outcome: r.outcome,
      status: r.canonical ? (known.get(r.canonical) ?? null) : null,
      ...(r.reason ? { reason: r.reason } : {}),
    })),
  })
}

async function add(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const inputs = urlList(body.urls, MAX_URLS)
  const override = body.override === true
  // Games read from an itch.io collection keep where they came from.
  const submitter = typeof body.via === 'string' && /^collection:\d{1,12}$/.test(body.via) ? body.via : 'admin'
  const { results, known } = await classifyInputs(ctx, inputs)
  await ctx.store.insert(
    results
      .filter((r) => r.store && r.canonical)
      .map((r) => ({
        url: r.canonical as string,
        source: 'admin' as const,
        submitter,
        flags: autoFlags(r.outcome),
      })),
    ctx.now,
  )
  // Rows that exist now and are waiting (new, pending, failed, or rejected
  // and explicitly re-added) are approved right away.
  const approvable = results
    .filter(
      (r) =>
        r.canonical &&
        (r.store ||
          (r.outcome === 'duplicate_pending' && ['pending', 'failed'].includes(known.get(r.canonical) ?? '')) ||
          (r.outcome === 'rejected' && override)),
    )
    .map((r) => r.canonical as string)
  const decision = approvable.length > 0 ? await approve(ctx, approvable, override) : null
  const approved = new Set(decision?.approved ?? [])
  const skipped = new Map((decision?.skipped ?? []).map((s) => [s.url, s.reason]))
  return json({
    sha: decision?.sha ?? null,
    at: isoSeconds(ctx.now),
    results: results.map((r) => ({
      input: r.input,
      url: r.canonical,
      outcome: r.outcome,
      approved: r.canonical !== null && approved.has(r.canonical),
      ...(r.canonical && skipped.has(r.canonical) ? { reason: skipped.get(r.canonical) } : {}),
    })),
  })
}

export interface TrackItem {
  url: string
  state: 'waiting' | 'added' | 'dropped' | 'unknown'
  outcome?: string
  at?: string
  attempts?: number
  error?: string | null
}

/**
 * Where a queued game stands: still in temp_link.json (waiting, with its
 * failed attempts), a final outcome of the pipeline newer than `since`, in the
 * published catalog, or unknown (e.g. outcomes pruned after 90 days).
 */
export function trackItem(url: string, view: IngestView, catalog: { has(url: string): boolean }, since: string): TrackItem {
  if (view.queued.has(url)) {
    const tried = view.attempts.get(url)
    return { url, state: 'waiting', ...(tried ? { attempts: tried.attempts, error: tried.error } : {}) }
  }
  const outcome = view.outcomes.get(url)
  if (outcome && outcome.at >= since) {
    return { url, state: POSITIVE_OUTCOMES.has(outcome.outcome) ? 'added' : 'dropped', outcome: outcome.outcome, at: outcome.at }
  }
  if (catalog.has(url)) return { url, state: 'added' }
  return { url, state: 'unknown' }
}

async function track(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const urls = [
    ...new Set(
      urlList(body.urls, MAX_TRACK_URLS)
        .map((u) => canonicalize(u))
        .filter((u): u is string => u !== null),
    ),
  ]
  const since = typeof body.since === 'string' ? body.since : ''
  const [view, catalog] = await Promise.all([needRepo(ctx).ingestView(), catalogUrls(ctx.data)])
  return json({ head: view.head, items: urls.map((u) => trackItem(u, view, catalog, since)) })
}

async function patchGame(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const url = gameUrl(body.url)
  if (!isObject(body.edit) || Object.keys(body.edit).length === 0) throw new HttpError(400, 'invalid_edit')
  const problem = validateEdit(body.edit)
  if (problem) throw new HttpError(400, 'invalid_edit', problem)
  const edit = body.edit as FieldEdit
  const result = await needRepo(ctx).editCatalog(new Map([[url, edit]]), [])
  if (result.sha) await ctx.store.audit(ctx.actor, 'edit', url, result.sha, JSON.stringify(edit))
  return json({ sha: result.sha, edited: result.summary.edited })
}

async function patchGames(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const list = body.edits
  if (!Array.isArray(list) || list.length === 0) throw new HttpError(400, 'invalid_body', '`edits` must be a non-empty array')
  if (list.length > MAX_BULK) throw new HttpError(413, 'too_many_edits', `At most ${MAX_BULK} games per request`)
  const edits = new Map<string, FieldEdit>()
  for (const item of list) {
    if (!isObject(item)) throw new HttpError(400, 'invalid_body')
    const url = gameUrl(item.url)
    if (edits.has(url)) throw new HttpError(400, 'invalid_body', `${url} is listed twice`)
    if (!isObject(item.edit) || Object.keys(item.edit).length === 0) throw new HttpError(400, 'invalid_edit')
    const problem = validateEdit(item.edit)
    if (problem) throw new HttpError(400, 'invalid_edit', problem)
    edits.set(url, item.edit as FieldEdit)
  }
  const result = await needRepo(ctx).editCatalog(edits, [])
  if (result.sha && result.edited.length > 0) {
    const kinds = new Set([...edits.values()].map((e) => JSON.stringify(e)))
    const detail = kinds.size === 1 ? [...kinds][0] : JSON.stringify({ fields: [...new Set([...edits.values()].flatMap(Object.keys))] })
    await ctx.store.audit(ctx.actor, 'edit', result.edited.join(' '), result.sha, detail)
  }
  return json({ sha: result.sha, edited: result.edited, unchanged: result.unchanged, notFound: result.missing })
}

/**
 * Remove games in one commit (same deleted-log entry as a pipeline removal),
 * then — best effort, the commit has landed — record it and delete the
 * games' resized covers. A failure there is reported, never a 500.
 */
async function removeGames(ctx: AdminContext, urls: string[], reason: string) {
  const result = await needRepo(ctx).editCatalog(
    new Map(),
    urls.map((url) => ({ url, reason })),
  )
  const warnings: string[] = []
  if (result.sha && result.removed.length > 0) {
    try {
      await ctx.store.audit(ctx.actor, 'delete', result.removed.join(' '), result.sha, reason)
    } catch (e) {
      console.error('admin: audit after removal failed', e)
      warnings.push('audit_failed')
    }
  }
  const covers = { deleted: 0, failed: 0 }
  const keys = await Promise.all(result.thumbnails.flatMap((thumb) => THUMB_WIDTHS.map((w) => r2Key(w, thumb))))
  if (keys.length > 0) {
    try {
      await ctx.thumbs.delete(keys)
      covers.deleted = keys.length
    } catch (e) {
      console.error('admin: deleting resized covers failed', e)
      covers.failed = keys.length
      warnings.push('covers_failed')
    }
  }
  return { result, covers, warnings }
}

async function deleteGame(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const url = gameUrl(body.url)
  const reason = reasonOf(body.reason)
  const { result, warnings } = await removeGames(ctx, [url], reason)
  if (result.removed.length === 0) throw new HttpError(404, 'not_in_catalog')
  return json({ sha: result.sha, removed: result.removed.length, ...(warnings.length > 0 ? { warnings } : {}) })
}

async function deleteGames(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const inputs = urlList(body.urls, MAX_BULK)
  const reason = reasonOf(body.reason)
  const invalid = inputs.filter((u) => canonicalize(u) === null)
  const urls = [...new Set(inputs.map((u) => canonicalize(u)).filter((u): u is string => u !== null))]
  if (urls.length === 0) {
    return json({ sha: null, removed: [], notFound: [], invalid, covers: { deleted: 0, failed: 0 }, warnings: [] })
  }
  const { result, covers, warnings } = await removeGames(ctx, urls, reason)
  return json({ sha: result.sha, removed: result.removed, notFound: result.missing, invalid, covers, warnings })
}

async function restoreGame(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const url = gameUrl(body.url)
  const { sha, added } = await needRepo(ctx).queueForIngest([url], [url], 'admin')
  await ctx.store.insert([{ url, source: 'admin', submitter: 'admin' }], ctx.now)
  await ctx.store.setStatus([url], 'queued', ctx.actor, ctx.now)
  await ctx.store.audit(ctx.actor, 'restore', url, sha)
  return json({ sha, queued: added.length > 0, at: isoSeconds(ctx.now) })
}

async function activity(url: URL, ctx: AdminContext): Promise<Response> {
  const before = Number(url.searchParams.get('before'))
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100)
  const actions = (url.searchParams.get('actions') ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter((a) => /^[a-z_]{1,32}$/.test(a))
    .slice(0, 20)
  const rows = await ctx.store.activity({ before: Number.isInteger(before) && before > 0 ? before : null, limit: limit + 1, actions })
  const items = rows.slice(0, limit)
  return json({ items, next: rows.length > limit ? items[items.length - 1].id : null })
}

async function getSettings(ctx: AdminContext): Promise<Response> {
  const [automation, lastRun, collections] = await Promise.all([
    ctx.store.automation(ctx.now),
    ctx.store.lastRun(),
    ctx.store.watched(),
  ])
  return json({ automation, lastRun, collections, writes: ctx.repo !== null })
}

/** The new auto-approve rules from a PUT body, or a 400. */
export function parseAutomationInput(value: unknown, current: AutomationSettings, now: Date): AutomationSettings {
  if (!isObject(value)) throw new HttpError(400, 'invalid_settings', '`automation` must be an object')
  const { enabled, sources, hours, includeOlder } = value
  if (typeof enabled !== 'boolean') throw new HttpError(400, 'invalid_settings', '`enabled` must be true or false')
  if (
    !Array.isArray(sources) ||
    new Set(sources).size !== sources.length ||
    !sources.every((s) => (AUTOMATION_SOURCES as readonly unknown[]).includes(s))
  ) {
    throw new HttpError(400, 'invalid_settings', `\`sources\` must list some of ${AUTOMATION_SOURCES.join(', ')}`)
  }
  if (!Number.isInteger(hours) || (hours as number) < 1 || (hours as number) > 720) {
    throw new HttpError(400, 'invalid_settings', '`hours` must be a whole number from 1 to 720')
  }
  // Switching on (again) starts a new baseline: what waited meanwhile is not approved
  // in bulk unless the maintainer asks for it.
  let since = current.since
  if (includeOlder === true) since = '1970-01-01T00:00:00Z'
  else if (enabled && !current.enabled) since = isoSeconds(now)
  return { enabled, sources: sources as CandidateSource[], hours: hours as number, since }
}

async function putSettings(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const current = await ctx.store.automation(ctx.now)
  const next = parseAutomationInput(body.automation, current, ctx.now)
  await ctx.store.putAutomation(next, ctx.actor, ctx.now)
  await ctx.store.audit(ctx.actor, 'settings', 'automation', null, JSON.stringify(next))
  return json({ automation: next })
}

/** An itch.io read failure as the admin's error. */
function readFailure(error: ReadError): HttpError {
  switch (error.kind) {
    case 'rate_limited':
      return new HttpError(429, 'itch_rate_limited', `itch.io asks to slow down: try again in ${Math.ceil(error.retryAfterMs / 1000)} s`)
    case 'unavailable':
      return new HttpError(404, 'collection_unavailable', `itch.io answered ${error.status}`)
    case 'unreadable':
      return new HttpError(422, 'collection_unreadable')
    default:
      return new HttpError(502, 'itch_error', error.status ? `itch.io answered ${error.status}` : 'itch.io could not be reached')
  }
}

function collectionRef(value: unknown) {
  const ref = parseCollectionUrl(value)
  if (!ref) throw new HttpError(400, 'invalid_collection_url', 'Expected https://itch.io/c/<id>/<name>')
  return ref
}

async function readCollectionPages(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const ref = collectionRef(body.url)
  const page = Number.isInteger(body.page) && (body.page as number) >= 1 ? Math.min(body.page as number, 10_000) : 1
  const read = await readCollection(ref, { ...ctx.itch, fromPage: page, maxPages: COLLECTION_PAGES_PER_READ, pauseMs: 700 })
  if (read.error && read.pages.length === 0) throw readFailure(read.error)
  return json({
    collection: { id: read.ref.id, slug: read.ref.slug, url: collectionUrl(read.ref.id, read.ref.slug) },
    items: read.pages.flatMap((p) => p.items),
    pages: read.pages.length,
    // On an error after some pages, the client continues from the page that failed.
    nextPage: read.nextPage,
    ...(read.error ? { stopped: readFailure(read.error).error } : {}),
  })
}

async function watchCollection(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const ref = collectionRef(body.url)
  if (await ctx.store.collection(ref.id)) throw new HttpError(409, 'collection_exists')
  if ((await ctx.store.watched()).length >= MAX_WATCHED) {
    throw new HttpError(409, 'too_many_collections', `At most ${MAX_WATCHED} collections`)
  }
  // Read its first page: the collection must exist, and this resolves its slug.
  const read = await readCollection(ref, { ...ctx.itch, fromPage: 1, maxPages: 1, pauseMs: 0 })
  if (read.error) throw readFailure(read.error)
  await ctx.store.watch(read.ref.id, read.ref.slug, ctx.actor, ctx.now)
  await ctx.store.audit(ctx.actor, 'collection_watch', collectionUrl(read.ref.id, read.ref.slug), null)
  return json({ collection: await ctx.store.collection(read.ref.id) })
}

function collectionId(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{1,12}$/.test(value)) throw new HttpError(400, 'invalid_body', '`id` must be a collection id')
  return value
}

async function toggleCollection(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const id = collectionId(body.id)
  if (typeof body.enabled !== 'boolean') throw new HttpError(400, 'invalid_body', '`enabled` must be true or false')
  if (!(await ctx.store.setWatched(id, body.enabled))) throw new HttpError(404, 'not_found')
  await ctx.store.audit(ctx.actor, 'collection_toggle', id, null, body.enabled ? 'on' : 'off')
  return json({ collection: await ctx.store.collection(id) })
}

async function unwatchCollection(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const id = collectionId(body.id)
  if (!(await ctx.store.unwatch(id))) throw new HttpError(404, 'not_found')
  await ctx.store.audit(ctx.actor, 'collection_unwatch', id, null)
  return json({ removed: true })
}

/** Route an authenticated admin API request. */
export async function adminApi(request: Request, url: URL, ctx: AdminContext): Promise<Response> {
  try {
    return await route(request, url, ctx)
  } catch (e) {
    return errorResponse(e)
  }
}

async function route(request: Request, url: URL, ctx: AdminContext): Promise<Response> {
  const route = `${request.method} ${trimEnd(url.pathname, '/')}`
  switch (route) {
    case 'GET /api/admin/me':
      return json({ email: ctx.actor, writes: ctx.repo !== null, repo: ctx.repoName ?? null })
    case 'GET /api/admin/queue':
      return listQueue(url, ctx)
    case 'GET /api/admin/activity':
      return activity(url, ctx)
    case 'GET /api/admin/settings':
      return getSettings(ctx)
  }
  if (request.method === 'GET' || request.method === 'HEAD') throw new HttpError(404, 'not_found')
  const body = await readJson(request, route === 'PATCH /api/admin/games/bulk' ? BULK_EDIT_BODY_LIMIT : BODY_LIMIT)
  if (!isObject(body)) throw new HttpError(400, 'invalid_body')
  switch (route) {
    case 'POST /api/admin/queue/decide':
      return decide(body, ctx)
    case 'POST /api/admin/check':
      return check(body, ctx)
    case 'POST /api/admin/add':
      return add(body, ctx)
    case 'POST /api/admin/track':
      return track(body, ctx)
    case 'PATCH /api/admin/games':
      return patchGame(body, ctx)
    case 'PATCH /api/admin/games/bulk':
      return patchGames(body, ctx)
    case 'DELETE /api/admin/games':
      return deleteGame(body, ctx)
    case 'POST /api/admin/games/remove':
      return deleteGames(body, ctx)
    case 'POST /api/admin/games/restore':
      return restoreGame(body, ctx)
    case 'PUT /api/admin/settings':
      return putSettings(body, ctx)
    case 'POST /api/admin/collections/read':
      return readCollectionPages(body, ctx)
    case 'POST /api/admin/collections':
      return watchCollection(body, ctx)
    case 'PATCH /api/admin/collections':
      return toggleCollection(body, ctx)
    case 'DELETE /api/admin/collections':
      return unwatchCollection(body, ctx)
    default:
      throw new HttpError(404, 'not_found')
  }
}

export async function handleAdminApi(
  request: Request,
  url: URL,
  env: WorkerEnv,
  store: QueueStore | null,
): Promise<Response> {
  try {
    const actor = await maintainer(request, env)
    if (!store) throw new HttpError(503, 'not_configured')
    return await adminApi(request, url, {
      actor,
      store,
      data: { assets: env.ASSETS, origin: url.origin },
      repo: repoOps(env),
      repoName: env.GITHUB_REPO || null,
      thumbs: env.THUMBS,
      itch: {
        fetch: (input, init) => fetch(input, init),
        userAgent: env.BOT_UA,
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      },
      now: new Date(),
    })
  } catch (e) {
    // GitHub refused the write (bad App key, missing permission, API down):
    // say so in the admin instead of a bare "internal error".
    if (e instanceof GitHubError) return errorResponse(new HttpError(502, 'github_error', e.message))
    return errorResponse(e)
  }
}

/** /admin and /admin/* → the admin app shell (HashRouter), maintainer only. */
export async function serveAdminApp(request: Request, url: URL, env: WorkerEnv): Promise<Response> {
  const text = (status: number, body: string) =>
    new Response(body, {
      status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS },
    })
  if (request.method !== 'GET' && request.method !== 'HEAD') return text(405, 'Method not allowed')
  // The Access application covers /admin/* — send the bare path there so the
  // visitor gets the login page instead of a 403. Nothing is served here.
  if (url.pathname === '/admin') {
    return new Response(null, {
      status: 308,
      headers: { Location: `/admin/${url.search}`, 'Cache-Control': 'no-store', ...SECURITY_HEADERS },
    })
  }
  if (/\.[a-z0-9]+$/i.test(url.pathname) && url.pathname !== '/admin/index.html') return text(404, 'Not found')
  try {
    await maintainer(request, env)
  } catch (e) {
    return e instanceof HttpError && e.status === 503 ? text(503, 'Admin is not configured.') : text(403, 'Forbidden')
  }
  const shell = await env.ASSETS.fetch(new Request(new URL('/admin/', url), { headers: request.headers }))
  const headers = new Headers(shell.headers)
  headers.set('Content-Security-Policy', ADMIN_CSP)
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  headers.set('X-Frame-Options', 'DENY')
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v)
  return new Response(request.method === 'HEAD' ? null : shell.body, { status: shell.status, headers })
}
