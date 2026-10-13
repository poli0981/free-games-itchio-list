import { describe, expect, it, vi } from 'vitest'
import { collectionPageUrl, parseCollectionPage, parseCollectionUrl, readCollection } from './collections'
import fixture from './test/fixtures/collection-page.json'

describe('parseCollectionUrl', () => {
  it.each([
    ['https://itch.io/c/1015279/the-unofficial-racial-justice-free-games-collection', { id: '1015279', slug: 'the-unofficial-racial-justice-free-games-collection' }],
    ['itch.io/c/42', { id: '42', slug: null }],
    ['http://www.itch.io/c/42/Free-Picks/', { id: '42', slug: 'free-picks' }],
    ['https://itch.io/c/42/picks?page=2#top', { id: '42', slug: 'picks' }],
    ['  https://itch.io/c/42/picks  ', { id: '42', slug: 'picks' }],
  ])('%s', (input, expected) => {
    expect(parseCollectionUrl(input)).toEqual(expected)
  })

  it.each(['https://itch.io/games/free', 'https://evil.com/itch.io/c/1', 'https://itch.io/c/', 'https://itch.io/c/1234567890123', 42, null])(
    'rejects %s',
    (input) => {
      expect(parseCollectionUrl(input)).toBeNull()
    },
  )

  it('never asks for page=1 (itch.io redirects it to the HTML page)', () => {
    expect(collectionPageUrl('42', 'picks', 1)).toBe('https://itch.io/c/42/picks?format=json')
    expect(collectionPageUrl('42', 'picks', 3)).toBe('https://itch.io/c/42/picks?format=json&page=3')
  })
})

describe('parseCollectionPage', () => {
  it('reads every game cell, whatever the order of its link attributes', () => {
    const page = parseCollectionPage(fixture)
    expect(page).toEqual({
      page: 1,
      count: 5,
      cells: 5,
      items: [
        {
          url: 'https://alpha-dev.itch.io/first-light',
          title: 'First Light',
          image: 'https://img.itch.zone/aW1nLzEwMQ==/315x250%23cb/aaa.png',
          genre: 'Platformer',
          price: null,
        },
        {
          url: 'https://beta-studio.itch.io/rock-and-roll',
          title: "Rock & Roll '99",
          image: 'https://img.itch.zone/aW1nLzEwMg==/315x250%23cb/bbb.png',
          genre: 'Rhythm',
          price: '$4.99',
        },
        // example.com is not an itch.io game page; the repeated first game is listed once.
        { url: 'https://gamma.itch.io/no-cover', title: 'No Cover', image: null, genre: null, price: null },
      ],
    })
  })

  it('refuses anything that is not a collection page', () => {
    expect(parseCollectionPage(null)).toBeNull()
    expect(parseCollectionPage({ page: 1, content: '' })).toBeNull()
    expect(parseCollectionPage('<html>')).toBeNull()
  })
})

const cell = (slug: string) => `<div class="game_cell"><a class="title game_link" href="https://dev.itch.io/${slug}">${slug}</a></div>`
const body = (page: number, slugs: string[]) => ({ page, num_items: slugs.length, content: slugs.map(cell).join('') })

function itch(responses: Record<string, () => Response>) {
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const make = responses[url]
    if (!make) throw new Error(`unexpected ${url}`)
    return make()
  })
  return { fetch: fetch as unknown as typeof globalThis.fetch, userAgent: 'test', sleep: vi.fn(async () => {}) }
}

const BASE = 'https://itch.io/c/42/picks?format=json'

describe('readCollection', () => {
  it('reads pages until itch.io has no more, pausing between requests', async () => {
    const deps = itch({
      [BASE]: () => Response.json(body(1, ['a', 'b'])),
      [`${BASE}&page=2`]: () => Response.json(body(2, ['c'])),
      [`${BASE}&page=3`]: () => Response.json({ page: 3, num_items: 0, content: '' }),
    })
    const read = await readCollection({ id: '42', slug: 'picks' }, { ...deps, fromPage: 1, maxPages: 10, pauseMs: 700 })
    expect(read.pages.flatMap((p) => p.items.map((i) => i.url))).toEqual(['a', 'b', 'c'].map((s) => `https://dev.itch.io/${s}`))
    expect([read.nextPage, read.error]).toEqual([null, null])
    expect(deps.sleep).toHaveBeenCalledTimes(2)
    expect(deps.sleep).toHaveBeenCalledWith(700)
  })

  it('stops after maxPages and says where to continue', async () => {
    const deps = itch({
      [`${BASE}&page=4`]: () => Response.json(body(4, ['d'])),
      [`${BASE}&page=5`]: () => Response.json(body(5, ['e'])),
    })
    const read = await readCollection({ id: '42', slug: 'picks' }, { ...deps, fromPage: 4, maxPages: 2, pauseMs: 0 })
    expect(read.pages.map((p) => p.page)).toEqual([4, 5])
    expect(read.nextPage).toBe(6)
  })

  it('follows a redirect to the canonical slug once (itch.io drops the query string)', async () => {
    const deps = itch({
      'https://itch.io/c/42/collection?format=json': () =>
        new Response(null, { status: 302, headers: { location: 'https://itch.io/c/42/picks' } }),
      [BASE]: () => Response.json(body(1, ['a'])),
      [`${BASE}&page=2`]: () => Response.json({ page: 2, num_items: 0, content: '' }),
    })
    const read = await readCollection({ id: '42', slug: null }, { ...deps, fromPage: 1, maxPages: 5, pauseMs: 0 })
    expect(read.ref).toEqual({ id: '42', slug: 'picks' })
    expect(read.pages).toHaveLength(1)
  })

  it('treats a redirect elsewhere as unavailable', async () => {
    const deps = itch({
      [BASE]: () => new Response(null, { status: 302, headers: { location: 'https://itch.io/login' } }),
    })
    const read = await readCollection({ id: '42', slug: 'picks' }, { ...deps, fromPage: 1, maxPages: 5, pauseMs: 0 })
    expect(read.error).toEqual({ kind: 'unavailable', status: 302 })
  })

  it('reports rate limits with Retry-After, and keeps the pages read so far', async () => {
    const deps = itch({
      [BASE]: () => Response.json(body(1, ['a'])),
      [`${BASE}&page=2`]: () => new Response(null, { status: 429, headers: { 'retry-after': '120' } }),
    })
    const read = await readCollection({ id: '42', slug: 'picks' }, { ...deps, fromPage: 1, maxPages: 5, pauseMs: 0 })
    expect(read.pages).toHaveLength(1)
    expect(read.nextPage).toBe(2)
    expect(read.error).toEqual({ kind: 'rate_limited', status: 429, retryAfterMs: 120_000 })
  })

  it('maps an unknown collection (500), a network error and changed markup', async () => {
    const unknown = itch({ [BASE]: () => new Response('oops', { status: 500 }) })
    const opts = { fromPage: 1, maxPages: 5, pauseMs: 0 }
    expect((await readCollection({ id: '42', slug: 'picks' }, { ...unknown, ...opts })).error).toEqual({ kind: 'unavailable', status: 500 })

    const offline = { fetch: (async () => {
      throw new TypeError('network')
    }) as unknown as typeof fetch, userAgent: 't', sleep: async () => {} }
    expect((await readCollection({ id: '42', slug: 'picks' }, { ...offline, ...opts })).error).toEqual({ kind: 'error', status: 0 })

    // Items announced but no cell found: itch.io changed its markup — fail safe.
    const changed = itch({ [BASE]: () => Response.json({ page: 1, num_items: 30, content: '<li class="new_cell">x</li>' }) })
    expect((await readCollection({ id: '42', slug: 'picks' }, { ...changed, ...opts })).error).toEqual({ kind: 'unreadable', status: 422 })
  })

  it('stops when a page repeats itself or answers for another page', async () => {
    const repeating = itch({
      [BASE]: () => Response.json(body(1, ['a'])),
      [`${BASE}&page=2`]: () => Response.json(body(2, ['a'])),
    })
    const opts = { fromPage: 1, maxPages: 5, pauseMs: 0 }
    const read = await readCollection({ id: '42', slug: 'picks' }, { ...repeating, ...opts })
    expect([read.pages.length, read.nextPage]).toEqual([1, null])

    const elsewhere = itch({ [BASE]: () => Response.json(body(7, ['z'])) })
    const other = await readCollection({ id: '42', slug: 'picks' }, { ...elsewhere, ...opts })
    expect([other.pages.length, other.nextPage]).toEqual([0, null])
  })
})
