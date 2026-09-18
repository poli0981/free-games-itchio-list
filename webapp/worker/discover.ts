/**
 * Scheduled discovery of new free games from itch.io RSS feeds. Each run
 * polls ONE feed (the one polled longest ago that is not backing off), so
 * itch.io sees at most one request per cron tick. Items go to the review
 * queue as `source = 'rss'`; nothing is added to the catalog without a
 * maintainer's approval.
 */
import { canonicalize } from './canonical'
import { catalogUrls, deletedGames, type DataSource } from './data'
import { autoFlags, classify, isoSeconds, type FeedState, type QueueStore } from './queue'

interface Feed {
  id: string
  url: string
  genre: string | null
}

export const FEEDS: readonly Feed[] = [
  { id: 'free', url: 'https://itch.io/games/new-and-popular/free.xml', genre: null },
  {
    id: 'visual-novel',
    url: 'https://itch.io/games/new-and-popular/free/genre-visual-novel.xml',
    genre: 'Visual Novel',
  },
]

const BACKOFF_MS = 6 * 3_600_000
const MAX_ITEMS = 60

export interface FeedItem {
  url: string
  title: string
  image: string | null
  genre: string | null
  free: boolean
}

// Bracket tags itch.io appends to <title> that are not genres.
const NOT_GENRE = new Set(['free', 'windows', 'macos', 'linux', 'android', 'ios', 'html5', 'web', 'browser'])

function decode(text: string): string {
  return text
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim()
}

function tag(block: string, name: string): string | null {
  const m = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(block)
  return m ? decode(m[1]) : null
}

/** Items of an itch.io browse feed (`<item>` with plainTitle / price / imageurl). */
export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = []
  for (const [, block] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const url = tag(block, 'link') ?? tag(block, 'guid')
    if (!url) continue
    const rawTitle = tag(block, 'title') ?? ''
    const brackets = [...rawTitle.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim())
    const genre = brackets.find((b) => !NOT_GENRE.has(b.toLowerCase())) ?? null
    const price = tag(block, 'price') ?? ''
    const image = tag(block, 'imageurl')
    items.push({
      url,
      title: tag(block, 'plainTitle') ?? rawTitle.replace(/\s*\[[^\]]*\]/g, '').trim(),
      image: image?.startsWith('https://img.itch.zone/') ? image : null,
      genre,
      free: /^[^0-9]*0+(?:[.,]0+)?$/.test(price) || brackets.some((b) => b.toLowerCase() === 'free'),
    })
  }
  return items
}

/** The feed to poll now: not backing off, least recently polled first. */
export function pickFeed(feeds: readonly Feed[], states: Map<string, FeedState>, now: Date): Feed | null {
  const stamp = isoSeconds(now)
  const ready = feeds.filter((f) => (states.get(f.id)?.backoff_until ?? '') <= stamp)
  ready.sort((a, b) => (states.get(a.id)?.last_polled_at ?? '').localeCompare(states.get(b.id)?.last_polled_at ?? ''))
  return ready[0] ?? null
}

function retryAfterMs(header: string | null, now: Date): number {
  if (!header) return 0
  const seconds = Number(header)
  if (Number.isFinite(seconds)) return seconds * 1000
  const at = Date.parse(header)
  return Number.isNaN(at) ? 0 : at - now.getTime()
}

export interface DiscoverDeps {
  store: QueueStore
  data: DataSource
  fetch: typeof fetch
  userAgent: string
  now: Date
}

export interface DiscoverResult {
  feed: string | null
  status: number | null
  items: number
  added: number
}

export async function discover(deps: DiscoverDeps): Promise<DiscoverResult> {
  const { store, now } = deps
  const feed = pickFeed(FEEDS, await store.feeds(), now)
  if (!feed) return { feed: null, status: null, items: 0, added: 0 }

  const save = (status: number, backoffMs = 0) =>
    store.saveFeed({
      feed: feed.id,
      last_polled_at: isoSeconds(now),
      backoff_until: backoffMs > 0 ? isoSeconds(new Date(now.getTime() + backoffMs)) : null,
      last_status: status,
    })

  let res: Response
  try {
    res = await deps.fetch(feed.url, {
      headers: { 'User-Agent': deps.userAgent, Accept: 'application/rss+xml, application/xml;q=0.9' },
    })
  } catch {
    await save(0)
    return { feed: feed.id, status: 0, items: 0, added: 0 }
  }
  if (res.status === 429 || res.status === 503) {
    res.body?.cancel().catch(() => {})
    await save(res.status, Math.max(BACKOFF_MS, retryAfterMs(res.headers.get('retry-after'), now)))
    return { feed: feed.id, status: res.status, items: 0, added: 0 }
  }
  if (!res.ok) {
    res.body?.cancel().catch(() => {})
    await save(res.status)
    return { feed: feed.id, status: res.status, items: 0, added: 0 }
  }

  const items = parseFeed(await res.text())
    .filter((i) => i.free)
    .slice(0, MAX_ITEMS)
  const canonical = items.map((i) => canonicalize(i.url)).filter((u): u is string => u !== null)
  const [catalog, deleted, known] = await Promise.all([
    catalogUrls(deps.data),
    deletedGames(deps.data),
    store.statuses(canonical),
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
            source: 'rss' as const,
            title: items[i].title.slice(0, 200),
            image_url: items[i].image,
            genre_hint: items[i].genre ?? feed.genre,
            flags: autoFlags(r.outcome, items[i].title),
            submitter: `rss:${feed.id}`,
          },
        ]
      : [],
  )
  await store.insert(fresh, now)
  await save(200)
  return { feed: feed.id, status: 200, items: items.length, added: fresh.length }
}
