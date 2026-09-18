import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDataCache } from '../data'
import { discover, FEEDS, parseFeed, pickFeed } from '../discover'
import { QueueStore, type FeedState } from '../queue'
import { testDb } from './d1'
import { fakeData } from './fakes'

// Same shape as itch.io's browse feeds; made-up games.
const item = (slug: string, title: string, tags: string, price = '$0.00', image = true) => `<item>
<guid>https://studio.itch.io/${slug}</guid><title>${title} ${tags}</title><plainTitle>${title}</plainTitle>
${image ? `<imageurl>https://img.itch.zone/aW1n/315x250%23c/${slug}.png</imageurl>` : '<imageurl>https://evil.example/x.png</imageurl>'}
<price>${price}</price><currency>USD</currency><link>https://studio.itch.io/${slug}</link>
<description><![CDATA[Short blurb <img src="x"/>]]></description><pubDate>Mon, 14 Sep 2026 10:00:00 GMT</pubDate>
</item>`
const FEED = `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>t</title>
${item('moon-garden', 'Moon Garden', '[Free] [Puzzle] [Windows] [macOS]')}
${item('ink-and-rain', 'Ink &amp; Rain', '[Free] [Visual Novel] [HTML5]')}
${item('paid-thing', 'Paid Thing', '[$4.99] [Action]', '$4.99')}
${item('lewd-demo', 'Lewd Demo', '[Free] [Simulation]', '$0.00', false)}
${item('already-listed', 'Already Listed', '[Free] [Platformer]')}
</channel></rss>`

describe('parseFeed', () => {
  it('reads link, plain title, genre, price and a safe cover', () => {
    const items = parseFeed(FEED)
    expect(items).toHaveLength(5)
    expect(items[0]).toEqual({
      url: 'https://studio.itch.io/moon-garden',
      title: 'Moon Garden',
      image: 'https://img.itch.zone/aW1n/315x250%23c/moon-garden.png',
      genre: 'Puzzle',
      free: true,
    })
    expect(items[1]).toMatchObject({ title: 'Ink & Rain', genre: 'Visual Novel' })
    expect(items[2].free).toBe(false)
    expect(items[3].image).toBeNull() // only img.itch.zone covers are kept
  })
})

describe('pickFeed', () => {
  const now = new Date('2026-09-18T12:00:00Z')
  const state = (feed: string, polled: string | null, backoff: string | null = null): [string, FeedState] => [
    feed,
    { feed, last_polled_at: polled, backoff_until: backoff, last_status: 200 },
  ]
  it('takes the feed polled longest ago that is not backing off', () => {
    expect(pickFeed(FEEDS, new Map(), now)?.id).toBe('free')
    expect(pickFeed(FEEDS, new Map([state('free', '2026-09-18T08:00:00Z')]), now)?.id).toBe('visual-novel')
    const both = new Map([state('free', '2026-09-18T04:00:00Z'), state('visual-novel', '2026-09-18T08:00:00Z')])
    expect(pickFeed(FEEDS, both, now)?.id).toBe('free')
    both.set(...state('free', '2026-09-18T04:00:00Z', '2026-09-18T14:00:00Z'))
    expect(pickFeed(FEEDS, both, now)?.id).toBe('visual-novel')
    both.set(...state('visual-novel', '2026-09-18T08:00:00Z', '2026-09-18T13:00:00Z'))
    expect(pickFeed(FEEDS, both, now)).toBeNull()
  })
})

describe('discover', () => {
  let db: D1Database
  let dispose: () => Promise<void>
  let store: QueueStore
  const now = new Date('2026-09-18T12:00:00Z')

  beforeAll(async () => {
    ;({ db, dispose } = await testDb())
  }, 60_000)
  afterAll(() => dispose())
  beforeEach(async () => {
    resetDataCache()
    await db.batch(['candidates', 'feed_state'].map((t) => db.prepare(`DELETE FROM ${t}`)))
    store = new QueueStore(db)
  })

  it('queues new free games from one feed, with hints and flags', async () => {
    const fetch = vi.fn(async () => new Response(FEED, { headers: { 'content-type': 'application/xml' } }))
    const result = await discover({
      store,
      data: fakeData(['https://studio.itch.io/already-listed']),
      fetch: fetch as unknown as typeof globalThis.fetch,
      userAgent: 'FreeItchGamesBot/test',
      now,
    })
    expect(result).toEqual({ feed: 'free', status: 200, items: 4, added: 3 })
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>)['User-Agent']).toBe('FreeItchGamesBot/test')
    const rows = new Map((await store.list('pending')).map((r) => [r.url, r]))
    expect([...rows.keys()].sort()).toEqual([
      'https://studio.itch.io/ink-and-rain',
      'https://studio.itch.io/lewd-demo',
      'https://studio.itch.io/moon-garden',
    ])
    expect(rows.get('https://studio.itch.io/moon-garden')).toMatchObject({
      source: 'rss',
      submitter: 'rss:free',
      genre_hint: 'Puzzle',
      title: 'Moon Garden',
    })
    expect(JSON.parse(rows.get('https://studio.itch.io/lewd-demo')!.flags)).toEqual(['nsfw_keyword', 'demo'])
    expect((await store.feeds()).get('free')).toMatchObject({ last_status: 200, backoff_until: null })
  })

  it('backs off for at least 6 hours on 429, longer if asked', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 429, headers: { 'retry-after': '43200' } }))
    const result = await discover({ store, data: fakeData(), fetch: fetch as unknown as typeof globalThis.fetch, userAgent: 'x', now })
    expect(result.status).toBe(429)
    expect((await store.feeds()).get('free')?.backoff_until).toBe('2026-09-19T00:00:00Z')
    // Next run moves on to the other feed.
    const ok = vi.fn(async () => new Response('<rss></rss>'))
    expect((await discover({ store, data: fakeData(), fetch: ok as unknown as typeof globalThis.fetch, userAgent: 'x', now })).feed).toBe(
      'visual-novel',
    )
  })

  it('records network errors without throwing', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('Network connection lost.')
    })
    const result = await discover({ store, data: fakeData(), fetch: fetch as unknown as typeof globalThis.fetch, userAgent: 'x', now })
    expect(result).toMatchObject({ feed: 'free', status: 0, added: 0 })
  })
})
