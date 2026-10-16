/**
 * Review queue: classification of proposed URLs (pure) and the D1 store.
 *
 * Order of checks for each proposed URL:
 *   invalid_url → duplicate_in_request → duplicate_catalog → rejected (blocklist)
 *   → duplicate_pending (already waiting / queued) → previously_deleted
 *   (kept for review, flagged; approving needs an explicit override) → queued.
 */
import { canonicalize } from './canonical'

/** The table's CHECK still allows 'ext' (the browser extension, retired in 4.4.1); nothing writes it. */
export type CandidateSource = 'rss' | 'form' | 'admin'
export type CandidateStatus = 'pending' | 'rejected' | 'queued' | 'ingested' | 'failed'

/**
 * How a queued game's ingest ended: the pipeline's outcomes
 * (scripts/state/ingest_outcomes.json), or `timeout` when nothing came back
 * within 3 days.
 */
export type IngestOutcome = 'added' | 'duplicate' | 'paid' | 'dead' | 'private' | 'deleted' | 'gave_up' | 'timeout'

/** Outcomes that mean the game is in the catalog. */
export const POSITIVE_OUTCOMES: ReadonlySet<string> = new Set(['added', 'duplicate'])

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
  outcome: string | null
  outcome_at: string | null
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

/** The admin's auto-approve rules (settings key `automation`). */
export interface AutomationSettings {
  enabled: boolean
  sources: CandidateSource[]
  /** Hours a pending item waits for a manual decision first. */
  hours: number
  /** Only items discovered at or after this moment qualify (the backlog at switch-on does not). */
  since: string
}

const DEFAULT_AUTOMATION: Omit<AutomationSettings, 'since'> = { enabled: true, sources: ['rss', 'form'], hours: 24 }

export interface WatchedCollection {
  id: string
  slug: string
  enabled: number
  added_at: string
  added_by: string | null
  last_polled_at: string | null
  last_status: number | null
  backoff_until: string | null
  next_page: number
  last_found: number | null
  last_added: number | null
}

export type CollectionPoll = Pick<
  WatchedCollection,
  'id' | 'slug' | 'last_polled_at' | 'last_status' | 'backoff_until' | 'next_page' | 'last_found' | 'last_added'
>

export interface AuditRow {
  id: number
  at: string
  actor: string
  action: string
  target: string | null
  commit_sha: string | null
  detail: string | null
}

/** D1 binds at most 100 parameters per statement. */
const PARAM_SLICE = 90
const QUEUED_TIMEOUT_MS = 3 * 86_400_000
const FORM_NOTE_TTL_MS = 180 * 86_400_000

export function isoSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function slices<T>(items: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += PARAM_SLICE) out.push(items.slice(i, i + PARAM_SLICE))
  return out
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const AUTOMATION_SOURCES: readonly CandidateSource[] = ['rss', 'form']

/** Stored settings with every field checked; anything unusable falls back to `fallback`. */
function normalizeAutomation(value: unknown, fallback: AutomationSettings): AutomationSettings {
  const v = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const sources = Array.isArray(v.sources)
    ? AUTOMATION_SOURCES.filter((s) => (v.sources as unknown[]).includes(s))
    : fallback.sources
  return {
    enabled: typeof v.enabled === 'boolean' ? v.enabled : fallback.enabled,
    sources,
    hours: Number.isInteger(v.hours) && (v.hours as number) >= 1 && (v.hours as number) <= 720 ? (v.hours as number) : fallback.hours,
    since: typeof v.since === 'string' ? v.since : fallback.since,
  }
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

  /** One statement per 90 URLs (D1 also counts every statement of a batch towards its per-call limit). */
  async setStatus(urls: string[], status: CandidateStatus, actor: string, now = new Date()): Promise<void> {
    if (urls.length === 0) return
    await this.db.batch(
      slices(urls).map((slice) =>
        this.db
          .prepare(`UPDATE candidates SET status = ?, decided_by = ?, decided_at = ? WHERE url IN (${slice.map(() => '?').join(',')})`)
          .bind(status, actor, isoSeconds(now), ...slice),
      ),
    )
  }

  /**
   * Settle queued rows: with the pipeline's outcome for the game (newer than
   * the decision) → ingested or failed, carrying that outcome; without one,
   * in the published catalog → ingested; queued for more than 3 days →
   * failed (`timeout`), so it comes back for review.
   */
  async reconcile(
    catalog: Set<string>,
    outcomes: Map<string, { outcome: string; at: string }> = new Map(),
    now = new Date(),
  ): Promise<{ ingested: number; failed: number }> {
    const { results } = await this.db
      .prepare("SELECT url, decided_at FROM candidates WHERE status = 'queued'")
      .all<{ url: string; decided_at: string | null }>()
    const cutoff = isoSeconds(new Date(now.getTime() - QUEUED_TIMEOUT_MS))
    const groups = new Map<string, { status: CandidateStatus; outcome: string; urls: string[] }>()
    const settle = (url: string, status: CandidateStatus, outcome: string) => {
      const key = `${status} ${outcome}`
      const group = groups.get(key) ?? { status, outcome, urls: [] }
      group.urls.push(url)
      groups.set(key, group)
    }
    for (const row of results) {
      const known = outcomes.get(row.url)
      if (known && known.at >= (row.decided_at ?? '')) {
        settle(row.url, POSITIVE_OUTCOMES.has(known.outcome) ? 'ingested' : 'failed', known.outcome)
      } else if (catalog.has(row.url)) settle(row.url, 'ingested', 'added')
      else if ((row.decided_at ?? '') < cutoff) settle(row.url, 'failed', 'timeout')
    }
    const stamp = isoSeconds(now)
    const updates = [...groups.values()].flatMap((g) =>
      slices(g.urls).map((slice) =>
        this.db
          .prepare(
            `UPDATE candidates SET status = ?, outcome = ?, outcome_at = ?
             WHERE status = 'queued' AND url IN (${slice.map(() => '?').join(',')})`,
          )
          .bind(g.status, g.outcome, stamp, ...slice),
      ),
    )
    if (updates.length > 0) await this.db.batch(updates)
    const count = (status: CandidateStatus) =>
      [...groups.values()].filter((g) => g.status === status).reduce((n, g) => n + g.urls.length, 0)
    return { ingested: count('ingested'), failed: count('failed') }
  }

  /** Pending rows the auto-approve rules may queue (unflagged, waited long enough, no bad outcome). */
  async autoApprovable(opts: {
    sources: CandidateSource[]
    /** Latest discovered_at that has waited long enough. */
    before: string
    since: string
    limit: number
  }): Promise<CandidateRow[]> {
    if (opts.sources.length === 0) return []
    const { results } = await this.db
      .prepare(
        `SELECT * FROM candidates
         WHERE status = 'pending' AND flags = '[]' AND source IN (${opts.sources.map(() => '?').join(',')})
           AND (outcome IS NULL OR outcome IN ('added', 'duplicate'))
           AND discovered_at >= ? AND discovered_at <= ?
         ORDER BY discovered_at, url LIMIT ?`,
      )
      .bind(...opts.sources, opts.since, opts.before, opts.limit)
      .all<CandidateRow>()
    return results
  }

  /** Rows whose game is already in the catalog: nothing left to decide. */
  async markIngested(urls: string[], outcome: IngestOutcome, now = new Date()): Promise<void> {
    if (urls.length === 0) return
    await this.db.batch(
      slices(urls).map((slice) =>
        this.db
          .prepare(
            `UPDATE candidates SET status = 'ingested', outcome = ?, outcome_at = ? WHERE url IN (${slice.map(() => '?').join(',')})`,
          )
          .bind(outcome, isoSeconds(now), ...slice),
      ),
    )
  }

  /** The auto-approve rules; created on first read, with `since` = that moment (the backlog does not qualify). */
  async automation(now = new Date()): Promise<AutomationSettings> {
    const fresh: AutomationSettings = { ...DEFAULT_AUTOMATION, since: isoSeconds(now) }
    await this.db
      .prepare("INSERT INTO settings (key, value, updated_at, updated_by) VALUES ('automation', ?, ?, 'default') ON CONFLICT (key) DO NOTHING")
      .bind(JSON.stringify(fresh), isoSeconds(now))
      .run()
    const row = await this.db.prepare("SELECT value FROM settings WHERE key = 'automation'").first<{ value: string }>()
    return normalizeAutomation(row ? safeJson(row.value) : null, fresh)
  }

  async putAutomation(settings: AutomationSettings, actor: string, now = new Date()): Promise<void> {
    await this.putSetting('automation', settings, actor, now)
  }

  /** What the last cron run of the automation did (shown in the admin; Workers logs are sampled). */
  async lastRun(): Promise<unknown> {
    const row = await this.db.prepare("SELECT value FROM settings WHERE key = 'automation_last_run'").first<{ value: string }>()
    return row ? safeJson(row.value) : null
  }

  async putLastRun(summary: unknown, now = new Date()): Promise<void> {
    await this.putSetting('automation_last_run', summary, 'cron', now)
  }

  private async putSetting(key: string, value: unknown, actor: string, now: Date): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
      )
      .bind(key, JSON.stringify(value), isoSeconds(now), actor)
      .run()
  }

  async watched(): Promise<WatchedCollection[]> {
    const { results } = await this.db.prepare('SELECT * FROM watched_collections ORDER BY added_at, id').all<WatchedCollection>()
    return results
  }

  async collection(id: string): Promise<WatchedCollection | null> {
    return this.db.prepare('SELECT * FROM watched_collections WHERE id = ?').bind(id).first<WatchedCollection>()
  }

  async watch(id: string, slug: string, actor: string, now = new Date()): Promise<void> {
    await this.db
      .prepare('INSERT INTO watched_collections (id, slug, added_at, added_by) VALUES (?, ?, ?, ?)')
      .bind(id, slug, isoSeconds(now), actor)
      .run()
  }

  async setWatched(id: string, enabled: boolean): Promise<boolean> {
    const res = await this.db.prepare('UPDATE watched_collections SET enabled = ? WHERE id = ?').bind(enabled ? 1 : 0, id).run()
    return (res.meta.changes ?? 0) > 0
  }

  async unwatch(id: string): Promise<boolean> {
    const res = await this.db.prepare('DELETE FROM watched_collections WHERE id = ?').bind(id).run()
    return (res.meta.changes ?? 0) > 0
  }

  /** Enabled collections that are not backing off, the longest-unread first. */
  async collectionsDue(now = new Date()): Promise<WatchedCollection[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM watched_collections WHERE enabled = 1 AND (backoff_until IS NULL OR backoff_until <= ?)
         ORDER BY coalesce(last_polled_at, ''), id`,
      )
      .bind(isoSeconds(now))
      .all<WatchedCollection>()
    return results
  }

  async saveCollectionPoll(poll: CollectionPoll): Promise<void> {
    await this.db
      .prepare(
        `UPDATE watched_collections SET slug = ?, last_polled_at = ?, last_status = ?, backoff_until = ?,
           next_page = ?, last_found = ?, last_added = ? WHERE id = ?`,
      )
      .bind(
        poll.slug,
        poll.last_polled_at,
        poll.last_status,
        poll.backoff_until,
        poll.next_page,
        poll.last_found,
        poll.last_added,
        poll.id,
      )
      .run()
  }

  /** The audit log, newest first; `before` is the id to continue below. */
  async activity(opts: { before: number | null; limit: number; actions: string[] }): Promise<AuditRow[]> {
    const where: string[] = []
    const params: (string | number)[] = []
    if (opts.before !== null) {
      where.push('id < ?')
      params.push(opts.before)
    }
    if (opts.actions.length > 0) {
      where.push(`action IN (${opts.actions.map(() => '?').join(',')})`)
      params.push(...opts.actions)
    }
    const { results } = await this.db
      .prepare(`SELECT * FROM audit_log ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT ?`)
      .bind(...params, opts.limit)
      .all<AuditRow>()
    return results
  }

  /** Retention: Suggest-form notes after 180 days. */
  async purge(now = new Date()): Promise<void> {
    await this.db
      .prepare("UPDATE candidates SET note = NULL WHERE source = 'form' AND note IS NOT NULL AND discovered_at < ?")
      .bind(isoSeconds(new Date(now.getTime() - FORM_NOTE_TTL_MS)))
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
