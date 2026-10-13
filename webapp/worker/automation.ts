/**
 * The admin's automatic rules, run by the cron after discovery and
 * reconciliation (index.ts):
 *
 *   - auto-approve: pending suggestions / discoveries from the chosen sources
 *     that carry no flag, have waited `hours` without a decision, and whose
 *     last ingest (if any) did not fail;
 *   - watched collections: new free games in the itch.io collections the
 *     maintainer follows are queued directly. A game that was removed from
 *     the catalog before, or whose title raises a flag, goes to the review
 *     queue instead; a URL D1 already knows (failed, rejected, waiting) is
 *     left to the maintainer.
 *
 * Everything approved in one run goes out in ONE commit to temp_link.json
 * (one ingest workflow run). D1 is updated only after that commit landed, so
 * a failed commit leaves every row (and the collections' next page) as it was
 * for the next run. Automatic commits never unblock a removed game: the
 * ingest pipeline still refuses anything in the deleted log.
 */
import { readCollection, type CollectionItem, type ReadOptions } from './collections'
import { catalogUrls, deletedGames, type DataSource } from './data'
import {
  autoFlags,
  classify,
  isoSeconds,
  type ClassifyContext,
  type CollectionPoll,
  type NewCandidate,
  type QueueStore,
} from './queue'
import type { RepoOps } from './repo'

/** Approvals per run (one ingest run handles ≈ 650 games). */
const MAX_APPROVALS = 100
/** itch.io collection pages read per run, one second apart. */
const MAX_PAGES = 30
/** Queued + review items from collections per run; the page being read is always finished. */
const SOFT_CAP = 150
const PAUSE_MS = 1000
const BACKOFF_MS = 6 * 3_600_000

export interface AutomationDeps {
  store: QueueStore
  data: DataSource
  repo: RepoOps
  itch: Pick<ReadOptions, 'fetch' | 'userAgent' | 'sleep'>
  now: Date
}

export interface AutomationRun {
  at: string
  approved: number
  added: number
  review: number
  duplicates: number
  pages: number
  sha: string | null
  errors: string[]
  collections: { id: string; status: number | null; found: number; added: number; next_page: number }[]
}

export interface CollectionPlan {
  /** Queued directly (never seen before, no flag). */
  add: NewCandidate[]
  /** Into the review queue (previously removed, or flagged). */
  review: NewCandidate[]
}

/** What to do with the free games read from a watched collection. */
export function planCollectionItems(items: CollectionItem[], ctx: ClassifyContext, collectionId: string): CollectionPlan {
  const plan: CollectionPlan = { add: [], review: [] }
  const results = classify(
    items.map((i) => i.url),
    ctx,
  )
  results.forEach((r, i) => {
    if (!r.store || !r.canonical) return // in the catalog, rejected, already waiting, listed twice
    const item = items[i]
    const flags = autoFlags(r.outcome, item.title)
    const candidate: NewCandidate = {
      url: r.canonical,
      source: 'admin',
      title: item.title.slice(0, 200),
      image_url: item.image,
      genre_hint: item.genre,
      flags,
      submitter: `collection:${collectionId}`,
    }
    if (r.outcome === 'previously_deleted' || flags.length > 0) plan.review.push(candidate)
    else if (!ctx.known.has(r.canonical)) plan.add.push(candidate) // a failed row is the maintainer's call
  })
  return plan
}

export async function runAutomation(deps: AutomationDeps): Promise<AutomationRun> {
  const { store, now } = deps
  const run: AutomationRun = {
    at: isoSeconds(now),
    approved: 0,
    added: 0,
    review: 0,
    duplicates: 0,
    pages: 0,
    sha: null,
    errors: [],
    collections: [],
  }
  const [settings, catalog, deleted] = await Promise.all([store.automation(now), catalogUrls(deps.data), deletedGames(deps.data)])
  const inCatalog = new Set(catalog.keys())

  // 1. Auto-approve.
  const approvals: string[] = []
  if (settings.enabled) {
    const before = isoSeconds(new Date(now.getTime() - settings.hours * 3_600_000))
    const rows = await store.autoApprovable({ sources: settings.sources, before, since: settings.since, limit: MAX_APPROVALS })
    const duplicates: string[] = []
    for (const row of rows) {
      if (inCatalog.has(row.url)) duplicates.push(row.url)
      else if (!deleted.has(row.url)) approvals.push(row.url) // a removed game stays for review
    }
    await store.markIngested(duplicates, 'duplicate', now)
    run.duplicates = duplicates.length
  }

  // 2. Watched collections, one page at a time.
  const adds = new Map<string, NewCandidate>()
  const polls: (CollectionPoll & { from: number; addedHere: number })[] = []
  for (const c of await store.collectionsDue(now)) {
    if (run.pages >= MAX_PAGES || adds.size + run.review >= SOFT_CAP) break
    const poll = {
      id: c.id,
      slug: c.slug,
      last_polled_at: isoSeconds(now),
      last_status: 200 as number | null,
      backoff_until: null as string | null,
      next_page: c.next_page,
      last_found: 0,
      last_added: 0,
      from: c.next_page,
      addedHere: 0,
    }
    polls.push(poll)
    let rateLimited = false
    while (run.pages < MAX_PAGES && adds.size + run.review < SOFT_CAP) {
      if (run.pages > 0) await deps.itch.sleep(PAUSE_MS)
      run.pages += 1
      const read = await readCollection({ id: c.id, slug: poll.slug }, { ...deps.itch, fromPage: poll.next_page, maxPages: 1, pauseMs: 0 })
      poll.slug = read.ref.slug
      if (read.error) {
        poll.last_status = read.error.status
        if (read.error.kind === 'rate_limited') {
          poll.backoff_until = isoSeconds(new Date(now.getTime() + Math.max(BACKOFF_MS, read.error.retryAfterMs)))
          rateLimited = true
        }
        break
      }
      const items = read.pages.flatMap((p) => p.items).filter((i) => i.price === null)
      poll.last_found += items.length
      if (items.length > 0) {
        const known = await store.statuses(items.map((i) => i.url))
        const plan = planCollectionItems(items, { catalog: inCatalog, deleted, known }, c.id)
        for (const a of plan.add) {
          if (!adds.has(a.url)) {
            adds.set(a.url, a)
            poll.addedHere += 1
          }
        }
        if (plan.review.length > 0) {
          await store.insert(plan.review, now)
          run.review += plan.review.length
        }
      }
      // The end of the collection: start over from page 1 next time.
      poll.next_page = read.nextPage ?? 1
      if (read.nextPage === null) break
    }
    poll.last_added = poll.addedHere
    if (rateLimited) break // itch.io asked us to slow down: no more collections this run
  }

  // 3. One commit for everything, then D1.
  const urls = [...approvals, ...adds.keys()]
  if (urls.length > 0) {
    try {
      const { sha } = await deps.repo.queueForIngest(urls, [], 'auto')
      run.sha = sha
      await store.insert([...adds.values()], now)
      await store.setStatus(urls, 'queued', 'auto', now)
      if (approvals.length > 0) await store.audit('cron', 'auto_approve', approvals.join(' '), sha)
      if (adds.size > 0) await store.audit('cron', 'collection_add', [...adds.keys()].join(' '), sha)
      run.approved = approvals.length
      run.added = adds.size
    } catch (e) {
      run.errors.push(`commit: ${e instanceof Error ? e.message : String(e)}`)
      // Read those pages again next time: their games were not queued.
      for (const p of polls) {
        if (p.addedHere > 0) {
          p.next_page = p.from
          p.last_added = 0
        }
      }
    }
  }
  for (const p of polls) {
    await store.saveCollectionPoll({
      id: p.id,
      slug: p.slug,
      last_polled_at: p.last_polled_at,
      last_status: p.last_status,
      backoff_until: p.backoff_until,
      next_page: p.next_page,
      last_found: p.last_found,
      last_added: p.last_added,
    })
    run.collections.push({ id: p.id, status: p.last_status, found: p.last_found ?? 0, added: p.last_added ?? 0, next_page: p.next_page })
  }
  await store.putLastRun(run, now)
  return run
}
