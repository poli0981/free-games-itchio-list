/**
 * Maintainer-only admin: the JSON API under /api/admin/* and the admin app
 * shell at /admin. Both sit behind the Cloudflare Access "Admin" application
 * and re-verify its JWT here (access.ts): the edge login alone is not trusted.
 *
 *   GET    /api/admin/me                 who am I, what is configured
 *   GET    /api/admin/queue?status=…     review queue (+ counts per status)
 *   POST   /api/admin/queue/decide       {urls, action: approve|reject, override?}
 *   POST   /api/admin/add                {urls, override?} — add + approve at once
 *   PATCH  /api/admin/games              {url, edit: {safe_virus?, notes?, nsfw?}}
 *   DELETE /api/admin/games              {url, reason}
 *   POST   /api/admin/games/restore      {url} — un-delete: unblock + queue again
 *
 * Approving commits the URLs to scripts/temp_link.json (GitHub App,
 * verified commit); that push starts the ingest workflow, which scrapes and
 * adds the games. The maintainer's email is recorded only in the D1 audit
 * log, never in the public repository.
 */
import { AccessError, requireMaintainer, type AccessEnv } from './access'
import { canonicalize } from './canonical'
import { validateEdit, type FieldEdit } from './catalog'
import { catalogUrls, deletedGames, type DataSource } from './data'
import { ACCESS_CONFIG, GITHUB_CONFIG, missingConfig, type WorkerEnv } from './env'
import type { GitHubEnv } from './github'
import { HttpError, SECURITY_HEADERS, errorResponse, isObject, json, readJson } from './http'
import { r2Key } from './img'
import { autoFlags, classify, type CandidateRow, type CandidateStatus, type QueueStore } from './queue'
import { editCatalog, queueForIngest, type CatalogEditResult } from './repo'

const MAX_URLS = 200
const STATUSES: readonly CandidateStatus[] = ['pending', 'rejected', 'queued', 'ingested', 'failed']
const THUMB_WIDTHS = [160, 640]

// The admin app loads only its own bundle; cover images come straight from
// itch.io (candidates are not in the catalog yet, so /img won't serve them).
export const ADMIN_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://img.itch.zone",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

/** Writes to the repo; injectable so tests don't talk to GitHub. */
export interface RepoOps {
  queueForIngest(urls: string[], unblock: string[]): Promise<{ sha: string | null; added: string[] }>
  editCatalog(edits: Map<string, FieldEdit>, removals: { url: string; reason: string }[]): Promise<CatalogEditResult>
}

export interface AdminContext {
  actor: string
  store: QueueStore
  data: DataSource
  /** null when the GitHub App is not configured: read-only admin. */
  repo: RepoOps | null
  thumbs: Pick<R2Bucket, 'delete'>
  now: Date
}

function githubRepo(env: WorkerEnv): RepoOps | null {
  if (missingConfig(env, GITHUB_CONFIG).length > 0) return null
  const gh = env as WorkerEnv & GitHubEnv
  return {
    queueForIngest: (urls, unblock) => queueForIngest(gh, urls, unblock),
    editCatalog: (edits, removals) => editCatalog(gh, edits, removals),
  }
}

async function maintainer(request: Request, env: WorkerEnv): Promise<string> {
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

function urlList(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new HttpError(400, 'invalid_body', '`urls` must be a non-empty array')
  if (value.length > MAX_URLS) throw new HttpError(413, 'too_many_urls', `At most ${MAX_URLS} URLs per request`)
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
  const { sha } = await needRepo(ctx).queueForIngest(approved, override ? approved : [])
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
  const urls = urlList(body.urls).map(gameUrl)
  if (body.action === 'reject') {
    await ctx.store.setStatus(urls, 'rejected', ctx.actor, ctx.now)
    await ctx.store.audit(ctx.actor, 'reject', urls.join(' '), null)
    return json({ rejected: urls })
  }
  if (body.action !== 'approve') throw new HttpError(400, 'invalid_action')
  return json(await approve(ctx, urls, body.override === true))
}

async function add(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const inputs = urlList(body.urls)
  const override = body.override === true
  const canonical = inputs.map((u) => canonicalize(u)).filter((u): u is string => u !== null)
  const [catalog, deleted, known] = await Promise.all([
    catalogUrls(ctx.data),
    deletedGames(ctx.data),
    ctx.store.statuses(canonical),
  ])
  const results = classify(inputs, { catalog: new Set(catalog.keys()), deleted, known })
  await ctx.store.insert(
    results
      .filter((r) => r.store && r.canonical)
      .map((r) => ({
        url: r.canonical as string,
        source: 'admin' as const,
        submitter: 'admin',
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
    results: results.map((r) => ({
      input: r.input,
      url: r.canonical,
      outcome: r.outcome,
      approved: r.canonical !== null && approved.has(r.canonical),
      ...(r.canonical && skipped.has(r.canonical) ? { reason: skipped.get(r.canonical) } : {}),
    })),
  })
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

async function deleteGame(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const url = gameUrl(body.url)
  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (!reason || reason.length > 200) throw new HttpError(400, 'invalid_reason', 'A reason (≤ 200 characters) is required')
  const result = await needRepo(ctx).editCatalog(new Map(), [{ url, reason }])
  if (result.summary.removed === 0) throw new HttpError(404, 'not_in_catalog')
  // Resized covers of a removed game (content-removal requests included).
  const keys = await Promise.all(
    result.thumbnails.flatMap((thumb) => THUMB_WIDTHS.map((w) => r2Key(w, thumb))),
  )
  if (keys.length > 0) await ctx.thumbs.delete(keys)
  await ctx.store.audit(ctx.actor, 'delete', url, result.sha, reason)
  return json({ sha: result.sha, removed: result.summary.removed })
}

async function restoreGame(body: Record<string, unknown>, ctx: AdminContext): Promise<Response> {
  const url = gameUrl(body.url)
  const { sha, added } = await needRepo(ctx).queueForIngest([url], [url])
  await ctx.store.insert([{ url, source: 'admin', submitter: 'admin' }], ctx.now)
  await ctx.store.setStatus([url], 'queued', ctx.actor, ctx.now)
  await ctx.store.audit(ctx.actor, 'restore', url, sha)
  return json({ sha, queued: added.length > 0 })
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
  const route = `${request.method} ${url.pathname.replace(/\/+$/, '')}`
  if (route === 'GET /api/admin/me') {
    return json({ email: ctx.actor, writes: ctx.repo !== null })
  }
  if (route === 'GET /api/admin/queue') return listQueue(url, ctx)
  const body = await readJson(request, 64 * 1024)
  if (!isObject(body)) throw new HttpError(400, 'invalid_body')
  switch (route) {
    case 'POST /api/admin/queue/decide':
      return decide(body, ctx)
    case 'POST /api/admin/add':
      return add(body, ctx)
    case 'PATCH /api/admin/games':
      return patchGame(body, ctx)
    case 'DELETE /api/admin/games':
      return deleteGame(body, ctx)
    case 'POST /api/admin/games/restore':
      return restoreGame(body, ctx)
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
      repo: githubRepo(env),
      thumbs: env.THUMBS,
      now: new Date(),
    })
  } catch (e) {
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
