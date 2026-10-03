import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Game } from '@/types/game'
import { HttpError } from '../http-error'
import {
  createCatalogLoader,
  descriptionLookup,
  isStaleDescription,
  locate,
  shouldPersistQuery,
  type Catalog,
} from './catalog'
import { deflateRaw } from './compression'
import { encodePack, MANIFEST_FILE, type PackManifest } from './pack-format'

const BASE = 'https://example.test/data/pack'

function row(i: number) {
  return { url: `https://dev.itch.io/g${i}`, name: `Game ${i}`, dev: 'dev', tags: ['2D'], platforms: ['Windows'] }
}

async function packOf(rows: object[]): Promise<Uint8Array<ArrayBuffer>> {
  return deflateRaw(new TextEncoder().encode(JSON.stringify(encodePack(rows))))
}

function hex(n: number) {
  return n.toString(16).padStart(16, '0')
}

/** A fake site: two chunks (3 + 2 games), their descriptions, the log and the history. */
async function site(generation = 1) {
  const files = new Map<string, BodyInit>()
  const put = async (name: string, rows: object[]) => {
    files.set(`${BASE}/${name}`, await packOf(rows))
    return name
  }
  const g = generation * 100
  const manifest: PackManifest = {
    v: 1,
    total_games: 5,
    last_updated: `2026-10-0${generation}T00:00:00Z`,
    chunks: [
      {
        count: 3,
        main: await put(`${hex(g + 1)}.bin`, [row(1), row(2), row(3)]),
        desc: await put(`${hex(g + 2)}.bin`, [{ description: 'one' }, { description: 'two' }, { description: 'three' }]),
      },
      {
        count: 2,
        main: await put(`${hex(g + 3)}.bin`, [row(4), row(5)]),
        desc: await put(`${hex(g + 4)}.bin`, [{ description: 'four' }, { description: 'five' }]),
      },
    ],
    deleted: await put(`${hex(g + 5)}.bin`, [{ url: 'https://x.itch.io/y', name: 'Y', reason: 'Not free anymore', deleted_at: '2026-09-01' }]),
    history: await put(`${hex(g + 6)}.bin`, [{ date: '2026-09-30', total: 5 }]),
  }
  files.set(`${BASE}/${MANIFEST_FILE}`, JSON.stringify(manifest))
  return { files, manifest }
}

function serve(files: Map<string, BodyInit>, fail: (url: string) => number | undefined = () => undefined) {
  const calls: { url: string; cache?: RequestCache }[] = []
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, cache: init?.cache })
    const status = fail(url)
    if (status) return new Response('nope', { status })
    const body = files.get(url)
    return body === undefined ? new Response('missing', { status: 404 }) : new Response(body)
  }) as unknown as typeof globalThis.fetch
  return { fetch, calls }
}

afterEach(() => vi.restoreAllMocks())

describe('loadCatalog', () => {
  it('builds the game list in chunk order, without descriptions', async () => {
    const { files } = await site()
    const { loadCatalog } = createCatalogLoader({ ...serve(files), base: BASE })
    const catalog = await loadCatalog()
    expect(catalog.games.map((g) => g.name)).toEqual(['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'])
    expect(catalog.games.every((g) => !('description' in g))).toBe(true)
    expect(catalog.chunks.map(({ start, count }) => [start, count])).toEqual([
      [0, 3],
      [3, 2],
    ])
    expect(catalog.index).toEqual({ total_games: 5, last_updated: '2026-10-01T00:00:00Z' })
  })

  it('revalidates the manifest and reuses the HTTP cache for packs', async () => {
    const { files } = await site()
    const { fetch, calls } = serve(files)
    await createCatalogLoader({ fetch, base: BASE }).loadCatalog()
    expect(calls[0]).toEqual({ url: `${BASE}/${MANIFEST_FILE}`, cache: 'no-cache' })
    expect(calls.slice(1).every((c) => c.cache === undefined)).toBe(true)
  })

  it('reloads the manifest once when a pack is gone (a deploy happened in between)', async () => {
    const old = await site(1)
    const now = await site(2)
    // The browser still holds the old manifest; the server only has the new packs.
    const manifestBody = old.files.get(`${BASE}/${MANIFEST_FILE}`)
    const files = new Map(now.files)
    const { fetch, calls } = serve(files)
    const wrapped = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith(MANIFEST_FILE) && init?.cache !== 'reload') {
        calls.push({ url: String(input), cache: init?.cache })
        return new Response(manifestBody)
      }
      return fetch(input, init)
    }) as unknown as typeof globalThis.fetch
    const catalog = await createCatalogLoader({ fetch: wrapped, base: BASE }).loadCatalog()
    expect(catalog.index.last_updated).toBe('2026-10-02T00:00:00Z')
    expect(calls.filter((c) => c.url.endsWith(MANIFEST_FILE)).map((c) => c.cache)).toEqual(['no-cache', 'reload'])
  })

  it('keeps the chunks that loaded, and fails only when none did', async () => {
    const { files, manifest } = await site()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const partial = serve(files, (url) => (url.endsWith(manifest.chunks[1].main) ? 500 : undefined))
    const catalog = await createCatalogLoader({ ...partial, base: BASE }).loadCatalog()
    expect(catalog.games).toHaveLength(3)
    expect(catalog.chunks).toHaveLength(1)
    expect(warn).toHaveBeenCalled()

    const none = serve(files, (url) => (url.endsWith('.bin') ? 503 : undefined))
    await expect(createCatalogLoader({ ...none, base: BASE }).loadCatalog()).rejects.toBeInstanceOf(HttpError)
  })

  it('treats a pack with the wrong number of records as damaged', async () => {
    const { files, manifest } = await site()
    files.set(`${BASE}/${manifest.chunks[0].main}`, await packOf([row(1)]))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const catalog = await createCatalogLoader({ ...serve(files), base: BASE }).loadCatalog()
    expect(catalog.chunks.map((c) => c.start)).toEqual([0])
    expect(catalog.games.map((g) => g.name)).toEqual(['Game 4', 'Game 5'])
  })

  it('returns the previous catalog untouched when nothing changed', async () => {
    const { files } = await site()
    const loader = createCatalogLoader({ ...serve(files), base: BASE, now: () => 0 })
    const first = await loader.loadCatalog()
    const { fetch, calls } = serve(files)
    const again = await createCatalogLoader({ fetch, base: BASE }).loadCatalog(first)
    expect(again).toBe(first)
    expect(calls).toHaveLength(1) // the manifest only
  })

  it('shares one manifest request between queries that start together', async () => {
    const { files } = await site()
    let clock = 0
    const { fetch, calls } = serve(files)
    const loader = createCatalogLoader({ fetch, base: BASE, now: () => clock })
    await Promise.all([loader.loadCatalog(), loader.loadDeleted(), loader.loadHistory()])
    expect(calls.filter((c) => c.url.endsWith(MANIFEST_FILE))).toHaveLength(1)
    clock = 11_000
    await loader.loadHistory()
    expect(calls.filter((c) => c.url.endsWith(MANIFEST_FILE))).toHaveLength(2)
  })
})

describe('descriptions, removal log, history', () => {
  it('loads one chunk of descriptions, aligned with its games', async () => {
    const { files } = await site()
    const loader = createCatalogLoader({ ...serve(files), base: BASE })
    const catalog = await loader.loadCatalog()
    expect(await loader.loadDescriptions(catalog.chunks[1])).toEqual(['four', 'five'])
  })

  it('lets a missing description pack surface as a 404 (the caller reloads the catalog)', async () => {
    const { files } = await site()
    const loader = createCatalogLoader({ ...serve(files), base: BASE })
    const catalog = await loader.loadCatalog()
    files.delete(`${BASE}/${catalog.chunks[0].desc}`)
    await expect(loader.loadDescriptions(catalog.chunks[0])).rejects.toMatchObject({ status: 404 })
  })

  it('reads the log and the history, and falls back to empty lists', async () => {
    const { files } = await site()
    const loader = createCatalogLoader({ ...serve(files), base: BASE })
    expect(await loader.loadDeleted()).toEqual([
      { url: 'https://x.itch.io/y', name: 'Y', reason: 'Not free anymore', deleted_at: '2026-09-01' },
    ])
    expect(await loader.loadHistory()).toEqual([{ date: '2026-09-30', total: 5 }])
    const broken = createCatalogLoader({ ...serve(new Map()), base: BASE })
    expect(await broken.loadDeleted()).toEqual([])
    expect(await broken.loadHistory()).toEqual([])
  })

  it('rejects a manifest of another format', async () => {
    const files = new Map<string, BodyInit>([[`${BASE}/${MANIFEST_FILE}`, JSON.stringify({ v: 2 })]])
    await expect(createCatalogLoader({ ...serve(files), base: BASE }).loadCatalog()).rejects.toThrow(/version/)
  })
})

describe('helpers', () => {
  const games = [1, 2, 3, 4, 5].map((i) => ({ ...row(i) }) as unknown as Game)
  const catalog: Catalog = {
    games,
    index: { total_games: 5, last_updated: 'x' },
    chunks: [
      { start: 0, count: 3, main: 'm1.bin', desc: 'd1.bin' },
      { start: 3, count: 2, main: 'm2.bin', desc: 'd2.bin' },
    ],
  }

  it('locates a game in its chunk', () => {
    expect(locate(catalog, games[4])).toEqual({ chunk: catalog.chunks[1], row: 1 })
    expect(locate(catalog, { ...games[4] })).toBeUndefined()
  })

  it('maps games to the descriptions loaded so far', () => {
    const lookup = descriptionLookup(catalog, [undefined, ['four', 'five']])
    expect(lookup?.get(games[3])).toBe('four')
    expect(lookup?.has(games[0])).toBe(false)
    expect(descriptionLookup(undefined, [])).toBeUndefined()
  })

  it('persists only the public queries and current descriptions', () => {
    expect(shouldPersistQuery(['db', 'all'], undefined)).toBe(true)
    expect(shouldPersistQuery(['deleted'], undefined)).toBe(true)
    expect(shouldPersistQuery(['count-history'], undefined)).toBe(true)
    expect(shouldPersistQuery(['desc', 'd2.bin'], catalog)).toBe(true)
    expect(shouldPersistQuery(['desc', 'old.bin'], catalog)).toBe(false)
    expect(shouldPersistQuery(['desc', 'd2.bin'], undefined)).toBe(false)
    expect(shouldPersistQuery(['build-info'], catalog)).toBe(false)
    expect(isStaleDescription(['desc', 'old.bin'], catalog)).toBe(true)
    expect(isStaleDescription(['desc', 'd1.bin'], catalog)).toBe(false)
    expect(isStaleDescription(['db', 'all'], catalog)).toBe(false)
  })
})
