/**
 * Review queue: classification of proposed URLs (pure) and the D1 store.
 *
 * Order of checks for each proposed URL:
 *   invalid_url → duplicate_in_request → duplicate_catalog → rejected (blocklist)
 *   → duplicate_pending (already waiting / queued) → previously_deleted
 *   (kept for review, flagged; approving needs an explicit override) → queued.
 */
import { canonicalize } from './canonical'

type CandidateSource = 'rss' | 'form' | 'ext' | 'admin'
export type CandidateStatus = 'pending' | 'rejected' | 'queued' | 'ingested' | 'failed'

export type Outcome =
  | 'queued'
  | 'invalid_url'
  | 'duplicate_in_request'
  | 'duplicate_catalog'
  | 'duplicate_pending'
  | 'previously_deleted'
  | 'rejected'

export interface ClassifyContext {
  catalog: Set<string>
  deleted: Map<string, { reason: string; deleted_at: string }>
  /** Status of URLs already in D1 (only the ones asked about). */
  known: Map<string, CandidateStatus>
}

export interface Classified {
  input: string
  canonical: string | null
  outcome: Outcome
  /** Whether a new candidate row should be stored. */
  store: boolean
  reason?: string
}

export function classify(inputs: string[], ctx: ClassifyContext): Classified[] {
  const seen = new Set<string>()
  return inputs.map((input) => {
    const canonical = canonicalize(input)
    if (!canonical) return { input, canonical, outcome: 'invalid_url', store: false }
    if (seen.has(canonical)) return { input, canonical, outcome: 'duplicate_in_request', store: false }
    seen.add(canonical)
    if (ctx.catalog.has(canonical)) return { input, canonical, outcome: 'duplicate_catalog', store: false }
    const status = ctx.known.get(canonical)
    if (status === 'rejected') return { input, canonical, outcome: 'rejected', store: false }
    // 'ingested' rows whose game has since been removed (it is in the deleted
    // log) are reviewed again, flagged, like any previously deleted game.
    const cameBack = status === 'ingested' && ctx.deleted.has(canonical)
    if (status && status !== 'failed' && !cameBack) {
      return { input, canonical, outcome: 'duplicate_pending', store: false }
    }
    const deleted = ctx.deleted.get(canonical)
    if (deleted) {
      return {
        input,
        canonical,
        outcome: 'previously_deleted',
        store: true,
        reason: `${deleted.reason} (${deleted.deleted_at.slice(0, 10)})`,
      }
    }
    return { input, canonical, outcome: 'queued', store: true }
  })
}


const NSFW_WORDS = /(?:^|[^a-z0-9])(nsfw|18\+|hentai|porn|sex|adult|lewd|erotic)(?![a-z0-9])/i

/** Review hints stored with a new candidate (never decisions by themselves). */
export function autoFlags(outcome: Outcome, title?: string | null): string[] {
  const flags: string[] = []
  if (outcome === 'previously_deleted') flags.push('previously_deleted')
  if (title && NSFW_WORDS.test(title)) flags.push('nsfw_keyword')
  if (title && /(?:^|[^a-z0-9])demo(?![a-z0-9])/i.test(title)) flags.push('demo')
  return flags
}

export interface CandidateRow {
  url: string
  source: CandidateSource
  status: CandidateStatus
  title: string | null
  image_url: string | null
  genre_hint: string | null
  flags: string
  note: string | null
  submitter: string | null
  discovered_at: string
  decided_at: string | null
  decided_by: string | null
}

export interface NewCandidate {
  url: string
  source: CandidateSource
  title?: string | null
  image_url?: string | null
  genre_hint?: string | null
  flags?: string[]
  note?: string | null
  submitter?: string | null
}

export interface FeedState {
  feed: string
  last_polled_at: string | null
  backoff_until: string | null
  last_status: number | null
}

/** D1 binds at most 100 parameters per statement. */
const PARAM_SLICE = 90
const QUEUED_TIMEOUT_MS = 3 * 86_400_000
const IDEMPOTENCY_TTL_MS = 7 * 86_400_000
const FORM_NOTE_TTL_MS = 180 * 86_400_000

export function isoSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function slices<T>(items: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += PARAM_SLICE) out.push(items.slice(i, i + PARAM_SLICE))
  return out
}

export class QueueStore {
  private readonly db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async statuses(urls: string[]): Promise<Map<string, CandidateStatus>> {
    const out = new Map<string, CandidateStatus>()
    for (const slice of slices(urls)) {
      const { results } = await this.db
        .prepare(`SELECT url, status FROM candidates WHERE url IN (${slice.map(() => '?').join(',')})`)
        .bind(...slice)
        .all<{ url: string; status: CandidateStatus }>()
      for (const r of results) out.set(r.url, r.status)
    }
    return out
  }

  /** Insert new candidates; an existing `failed` or `ingested` row is reopened as pending. */
  async insert(items: NewCandidate[], now = new Date()): Promise<void> {
    if (items.length === 0) return
    const stmt = this.db.prepare(
      `INSERT INTO candidates (url, source, title, image_url, genre_hint, flags, note, submitter, discovered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (url) DO UPDATE SET status = 'pending', source = excluded.source,
         title = coalesce(excluded.title, candidates.title),
         image_url = coalesce(excluded.image_url, candidates.image_url),
         flags = excluded.flags, note = excluded.note, submitter = excluded.submitter,
         discovered_at = excluded.discovered_at, decided_at = NULL, decided_by = NULL
       WHERE candidates.status IN ('failed', 'ingested')`,
    )
    await this.db.batch(
      items.map((c) =>
        stmt.bind(
          c.url,
          c.source,
          c.title ?? null,
          c.image_url ?? null,
          c.genre_hint ?? null,
          JSON.stringify(c.flags ?? []),
          c.note ?? null,
          c.submitter ?? null,
          isoSeconds(now),
        ),
      ),
    )
  }

  async list(status: CandidateStatus, limit = 200): Promise<CandidateRow[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM candidates WHERE status = ? ORDER BY discovered_at DESC, url LIMIT ?')
      .bind(status, limit)
      .all<CandidateRow>()
    return results
  }

  async counts(): Promise<Record<CandidateStatus, number>> {
    const out: Record<CandidateStatus, number> = { pending: 0, rejected: 0, queued: 0, ingested: 0, failed: 0 }
    const { results } = await this.db
      .prepare('SELECT status, count(*) AS n FROM candidates GROUP BY status')
      .all<{ status: CandidateStatus; n: number }>()
    for (const r of results) out[r.status] = r.n
    return out
  }

  async get(urls: string[]): Promise<CandidateRow[]> {
    const out: CandidateRow[] = []
    for (const slice of slices(urls)) {
      const { results } = await this.db
        .prepare(`SELECT * FROM candidates WHERE url IN (${slice.map(() => '?').join(',')})`)
        .bind(...slice)
        .all<CandidateRow>()
      out.push(...results)
    }
    return out
  }

  async setStatus(urls: string[], status: CandidateStatus, actor: string, now = new Date()): Promise<void> {
    if (urls.length === 0) return
    const stmt = this.db.prepare('UPDATE candidates SET status = ?, decided_by = ?, decided_at = ? WHERE url = ?')
    await this.db.batch(urls.map((u) => stmt.bind(status, actor, isoSeconds(now), u)))
  }

  /**
   * queued → ingested once the game is in the published catalog; queued for
   * more than 3 days without showing up (the ingest workflow gave up on it)
   * → failed, so it comes back for review.
   */
  async reconcile(catalog: Set<string>, now = new Date()): Promise<{ ingested: number; failed: number }> {
    const { results } = await this.db
      .prepare("SELECT url, decided_at FROM candidates WHERE status = 'queued'")
      .all<{ url: string; decided_at: string | null }>()
    const cutoff = isoSeconds(new Date(now.getTime() - QUEUED_TIMEOUT_MS))
    const ingested = results.filter((c) => catalog.has(c.url)).map((c) => c.url)
    const failed = results.filter((c) => !catalog.has(c.url) && (c.decided_at ?? '') < cutoff).map((c) => c.url)
    const set = this.db.prepare('UPDATE candidates SET status = ? WHERE url = ?')
    const updates = [...ingested.map((u) => set.bind('ingested', u)), ...failed.map((u) => set.bind('failed', u))]
    if (updates.length > 0) await this.db.batch(updates)
    return { ingested: ingested.length, failed: failed.length }
  }

  /** Retention: idempotency records after 7 days, Suggest-form notes after 180. */
  async purge(now = new Date()): Promise<void> {
    await this.db.batch([
      this.db
        .prepare('DELETE FROM idempotency WHERE created_at < ?')
        .bind(isoSeconds(new Date(now.getTime() - IDEMPOTENCY_TTL_MS))),
      this.db
        .prepare("UPDATE candidates SET note = NULL WHERE source = 'form' AND note IS NOT NULL AND discovered_at < ?")
        .bind(isoSeconds(new Date(now.getTime() - FORM_NOTE_TTL_MS))),
    ])
  }

  async idempotent(client: string, key: string): Promise<{ body_hash: string; response: string } | null> {
    return this.db
      .prepare('SELECT body_hash, response FROM idempotency WHERE client = ? AND key = ?')
      .bind(client, key)
      .first<{ body_hash: string; response: string }>()
  }

  async remember(client: string, key: string, bodyHash: string, response: string, now = new Date()): Promise<void> {
    await this.db
      .prepare('INSERT OR IGNORE INTO idempotency (client, key, body_hash, response, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(client, key, bodyHash, response, isoSeconds(now))
      .run()
  }

  async feeds(): Promise<Map<string, FeedState>> {
    const { results } = await this.db.prepare('SELECT * FROM feed_state').all<FeedState>()
    return new Map(results.map((f) => [f.feed, f]))
  }

  async saveFeed(state: FeedState): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO feed_state (feed, last_polled_at, backoff_until, last_status) VALUES (?, ?, ?, ?)
         ON CONFLICT (feed) DO UPDATE SET last_polled_at = excluded.last_polled_at,
           backoff_until = excluded.backoff_until, last_status = excluded.last_status`,
      )
      .bind(state.feed, state.last_polled_at, state.backoff_until, state.last_status)
      .run()
  }

  async audit(actor: string, action: string, target: string, commitSha: string | null, detail?: string) {
    await this.db
      .prepare('INSERT INTO audit_log (actor, action, target, commit_sha, detail) VALUES (?, ?, ?, ?, ?)')
      .bind(actor, action, target, commitSha, detail ?? null)
      .run()
  }
}
