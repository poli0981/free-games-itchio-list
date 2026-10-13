/**
 * Reading public itch.io collections (itch.io/c/<id>/<slug>): the admin's
 * "import a collection" and the collections the cron follows.
 *
 * itch.io serves each page of a collection as JSON with `?format=json`
 * (`&page=N` from page 2 on): `{page, num_items, content}`, where `content` is
 * the HTML of the page's game cells. Quirks (checked 2026-10-13):
 *   - `&page=1` itself redirects to the HTML page, so page 1 has no `page`;
 *   - a wrong or missing slug redirects to the canonical URL WITHOUT the query
 *     string, so the slug is resolved from the Location header and retried;
 *   - an unknown id answers 500; past the last page `num_items` is 0;
 *   - the attributes of a cell's links come in varying order.
 * Priced games carry a `price_value` element; free ones have none (the ingest
 * pipeline checks again on the game page anyway).
 */
import { canonicalize } from './canonical'
import { decodeEntities } from './text'

export interface CollectionRef {
  id: string
  slug: string | null
}

export interface CollectionItem {
  url: string
  title: string
  image: string | null
  genre: string | null
  /** The listed price ("$4.99"), null for a free game. */
  price: string | null
}

export interface CollectionPage {
  page: number
  /** num_items as itch.io reports it (0 past the last page). */
  count: number
  /** Game cells found in the page's HTML (each may or may not be a game URL we accept). */
  cells: number
  items: CollectionItem[]
}

export type ReadError =
  | { kind: 'rate_limited'; status: number; retryAfterMs: number }
  | { kind: 'unavailable'; status: number }
  | { kind: 'unreadable'; status: number }
  | { kind: 'error'; status: number }

export interface ReadResult {
  ref: { id: string; slug: string }
  pages: CollectionPage[]
  /** The page to read next, or null when the end of the collection was reached. */
  nextPage: number | null
  error: ReadError | null
}

export interface ReadOptions {
  fromPage: number
  maxPages: number
  /** Pause between two page requests (itch.io sees at most one request at a time). */
  pauseMs: number
  fetch: typeof fetch
  userAgent: string
  sleep: (ms: number) => Promise<void>
}

const COLLECTION_URL = /^(?:https?:\/\/)?(?:www\.)?itch\.io\/c\/(\d{1,12})(?:\/([a-z0-9][a-z0-9_-]*))?\/?(?:[?#].*)?$/i

/** The id (and slug, when present) of an itch.io collection URL, or null. */
export function parseCollectionUrl(raw: unknown): CollectionRef | null {
  if (typeof raw !== 'string') return null
  const m = COLLECTION_URL.exec(raw.trim())
  return m ? { id: m[1], slug: m[2] ? m[2].toLowerCase() : null } : null
}

export function collectionUrl(id: string, slug: string): string {
  return `https://itch.io/c/${id}/${slug}`
}

export function collectionPageUrl(id: string, slug: string, page: number): string {
  return `${collectionUrl(id, slug)}?format=json${page > 1 ? `&page=${page}` : ''}`
}

function attributes(tag: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g)) out.set(m[1].toLowerCase(), m[2])
  return out
}

function hasClasses(attrs: Map<string, string>, ...names: string[]): boolean {
  const classes = (attrs.get('class') ?? '').split(/\s+/)
  return names.every((n) => classes.includes(n))
}

function text(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function parseCell(cell: string): CollectionItem | null {
  const links = [...cell.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({ attrs: attributes(m[1]), inner: m[2] }))
  const title =
    links.find((l) => hasClasses(l.attrs, 'title', 'game_link')) ?? links.find((l) => hasClasses(l.attrs, 'game_link'))
  const href = title?.attrs.get('href')
  const url = href ? canonicalize(decodeEntities(href)) : null
  if (!title || !url) return null
  const img = /<img\b([^>]*)>/i.exec(cell)
  const imgAttrs = img ? attributes(img[1]) : new Map<string, string>()
  const src = decodeEntities(imgAttrs.get('data-lazy_src') ?? imgAttrs.get('src') ?? '')
  const genre = /class="game_genre"[^>]*>([^<]*)</.exec(cell)
  const price = /class="price_value"[^>]*>([^<]*)</.exec(cell)
  return {
    url,
    title: text(title.inner).slice(0, 200) || url.replace('https://', ''),
    image: src.startsWith('https://img.itch.zone/') ? src : null,
    genre: genre ? decodeEntities(genre[1]) || null : null,
    price: price ? decodeEntities(price[1]) || null : null,
  }
}

/** One `?format=json` page, or null when the body does not look like one. */
export function parseCollectionPage(body: unknown): CollectionPage | null {
  if (typeof body !== 'object' || body === null) return null
  const { page, num_items: count, content } = body as Record<string, unknown>
  if (typeof page !== 'number' || typeof count !== 'number' || typeof content !== 'string') return null
  const starts = [...content.matchAll(/<div\b[^>]*\bclass="[^"]*\bgame_cell\b[^"]*"[^>]*>/g)].map((m) => m.index)
  const items: CollectionItem[] = []
  const seen = new Set<string>()
  starts.forEach((start, i) => {
    const item = parseCell(content.slice(start, starts[i + 1] ?? content.length))
    if (item && !seen.has(item.url)) {
      seen.add(item.url)
      items.push(item)
    }
  })
  return { page, count, cells: starts.length, items }
}

function retryAfterMs(header: string | null): number {
  const seconds = Number(header)
  return header && Number.isFinite(seconds) ? seconds * 1000 : 60_000
}

/**
 * Read up to `maxPages` pages from `fromPage`. Stops early at the end of the
 * collection, on an error (returned with the pages read so far), or when a
 * page repeats what was read already (a guard against looping forever).
 */
export async function readCollection(ref: CollectionRef, opts: ReadOptions): Promise<ReadResult> {
  let slug = ref.slug ?? 'collection'
  let resolved = false
  const pages: CollectionPage[] = []
  const seen = new Set<string>()
  let page = Math.max(1, Math.floor(opts.fromPage))
  const done = (nextPage: number | null, error: ReadError | null): ReadResult => ({
    ref: { id: ref.id, slug },
    pages,
    nextPage,
    error,
  })

  while (pages.length < opts.maxPages) {
    if (pages.length > 0) await opts.sleep(opts.pauseMs)
    let res: Response
    try {
      res = await opts.fetch(collectionPageUrl(ref.id, slug, page), {
        redirect: 'manual',
        headers: { 'User-Agent': opts.userAgent, Accept: 'application/json' },
      })
    } catch {
      return done(page, { kind: 'error', status: 0 })
    }
    if (res.status >= 300 && res.status < 400) {
      res.body?.cancel().catch(() => {})
      const target = parseCollectionUrl(res.headers.get('location') ?? '')
      // A different slug for the same collection: follow it once.
      if (!resolved && target?.id === ref.id && target.slug && target.slug !== slug) {
        slug = target.slug
        resolved = true
        continue
      }
      return done(page, { kind: 'unavailable', status: res.status })
    }
    if (res.status === 429 || res.status === 503) {
      res.body?.cancel().catch(() => {})
      return done(page, { kind: 'rate_limited', status: res.status, retryAfterMs: retryAfterMs(res.headers.get('retry-after')) })
    }
    if (res.status === 404 || res.status === 410 || res.status === 500) {
      res.body?.cancel().catch(() => {})
      return done(page, { kind: 'unavailable', status: res.status })
    }
    if (!res.ok) {
      res.body?.cancel().catch(() => {})
      return done(page, { kind: 'error', status: res.status })
    }
    let parsed: CollectionPage | null
    try {
      parsed = parseCollectionPage(await res.json())
    } catch {
      parsed = null
    }
    if (!parsed || (parsed.count > 0 && parsed.cells === 0)) return done(page, { kind: 'unreadable', status: 422 })
    if (parsed.count === 0 || parsed.page !== page) return done(null, null)
    const fresh = parsed.items.filter((i) => !seen.has(i.url))
    if (parsed.items.length > 0 && fresh.length === 0) return done(null, null)
    for (const i of parsed.items) seen.add(i.url)
    pages.push({ ...parsed, items: fresh })
    page += 1
  }
  return done(page, null)
}
