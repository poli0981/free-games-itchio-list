import type { QueryKey } from '@tanstack/react-query'
import type { CatalogIndex, CountHistoryPoint, DeletedGameEntry, Game } from '@/types/game'
import { PACK_BASE } from '../config'
import { HttpError } from '../http-error'
import { inflateRaw } from './compression'
import { decodePack, MANIFEST_FILE, parseManifest, type PackManifest, type PackRecord } from './pack-format'

export const CATALOG_KEY = ['db', 'all'] as const

/** A chunk that loaded: its games are `games[start, start + count)`, its descriptions are in `desc`. */
export interface CatalogChunk {
  start: number
  count: number
  main: string
  desc: string
}

export interface Catalog {
  games: Game[]
  index: CatalogIndex
  chunks: CatalogChunk[]
}

interface LoaderDeps {
  fetch: typeof fetch
  base: string
  now?: () => number
}

// The catalog, removal-log and history queries start together; one manifest
// request serves them all.
const MANIFEST_TTL = 10_000

const isGone = (e: unknown) => e instanceof HttpError && e.status === 404

function sameFiles(previous: Catalog, manifest: PackManifest): boolean {
  return (
    previous.index.last_updated === manifest.last_updated &&
    previous.chunks.length === manifest.chunks.length &&
    manifest.chunks.every((c, i) => previous.chunks[i].main === c.main && previous.chunks[i].desc === c.desc)
  )
}

function asGame(row: PackRecord): Game {
  if (typeof row.url !== 'string' || typeof row.name !== 'string') throw new Error('pack: record without url or name')
  return row as unknown as Game
}

export function createCatalogLoader({ fetch, base, now = Date.now }: LoaderDeps) {
  let memo: { at: number; promise: Promise<PackManifest> } | undefined

  /** `fresh` bypasses the HTTP cache: after a 404 the manifest we hold is older than the deploy. */
  function manifest(fresh = false): Promise<PackManifest> {
    if (!fresh && memo && now() - memo.at < MANIFEST_TTL) return memo.promise
    const url = `${base}/${MANIFEST_FILE}`
    const promise = (async () => {
      // 'no-cache' revalidates (usually a 304), so a new deploy shows up at once.
      const res = await fetch(url, { cache: fresh ? 'reload' : 'no-cache' })
      if (!res.ok) throw new HttpError(res.status, `Failed to fetch ${MANIFEST_FILE}: ${res.status} ${res.statusText}`, url)
      return parseManifest(await res.json())
    })()
    const entry = { at: now(), promise }
    memo = entry
    promise.catch(() => {
      if (memo === entry) memo = undefined
    })
    return promise
  }

  /** Packs never change under a name, so the browser's HTTP cache answers repeat requests. */
  async function pack(file: string, count?: number): Promise<PackRecord[]> {
    const url = `${base}/${file}`
    const res = await fetch(url)
    if (!res.ok) throw new HttpError(res.status, `Failed to fetch ${file}: ${res.status} ${res.statusText}`, url)
    const bytes = new Uint8Array(await res.arrayBuffer())
    try {
      const rows = decodePack(JSON.parse(new TextDecoder().decode(await inflateRaw(bytes))))
      if (count !== undefined && rows.length !== count) throw new Error(`${rows.length} records, expected ${count}`)
      return rows
    } catch (e) {
      // Not a TypeError: isNetworkError() would call a damaged file "offline".
      throw new Error(`Damaged catalog file ${file}`, { cause: e })
    }
  }

  async function mainPacks(m: PackManifest) {
    return Promise.allSettled(m.chunks.map(async (c) => (await pack(c.main, c.count)).map(asGame)))
  }

  async function loadCatalog(previous?: Catalog): Promise<Catalog> {
    let m = await manifest()
    if (previous && sameFiles(previous, m)) return previous
    let results = await mainPacks(m)
    if (results.some((r) => r.status === 'rejected' && isGone(r.reason))) {
      // Our manifest predates a deploy that replaced those files: once more with a fresh one.
      m = await manifest(true)
      results = await mainPacks(m)
    }
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0 && failed.length === results.length) throw failed[0].reason
    if (failed.length > 0) {
      // One missing chunk must not blank the whole catalog.
      console.warn(`Catalog: ${failed.length} of ${results.length} chunks failed to load`)
    }
    const games: Game[] = []
    const chunks: CatalogChunk[] = []
    m.chunks.forEach((c, i) => {
      const result = results[i]
      if (result.status !== 'fulfilled') return
      chunks.push({ start: games.length, count: c.count, main: c.main, desc: c.desc })
      for (const game of result.value) games.push(game)
    })
    return { games, index: { total_games: m.total_games, last_updated: m.last_updated }, chunks }
  }

  /**
   * One chunk's descriptions, row-aligned with its games. Only ever ask for the
   * `desc` named in the same catalog: a 404 means that catalog is from an older
   * deploy, and the caller reloads the catalog rather than mixing generations.
   */
  async function loadDescriptions(chunk: CatalogChunk): Promise<string[]> {
    const rows = await pack(chunk.desc, chunk.count)
    return rows.map((row) => (typeof row.description === 'string' ? row.description : ''))
  }

  async function small(pick: (m: PackManifest) => string): Promise<PackRecord[]> {
    try {
      return await pack(pick(await manifest()))
    } catch (e) {
      if (!isGone(e)) throw e
      return pack(pick(await manifest(true)))
    }
  }

  async function loadDeleted(): Promise<DeletedGameEntry[]> {
    try {
      return (await small((m) => m.deleted)) as unknown as DeletedGameEntry[]
    } catch {
      return []
    }
  }

  async function loadHistory(): Promise<CountHistoryPoint[]> {
    try {
      return (await small((m) => m.history)) as unknown as CountHistoryPoint[]
    } catch {
      return []
    }
  }

  return { loadCatalog, loadDescriptions, loadDeleted, loadHistory }
}

export const { loadCatalog, loadDescriptions, loadDeleted, loadHistory } = createCatalogLoader({
  fetch: (input, init) => fetch(input, init),
  base: PACK_BASE,
})

/** Where a game's description lives. `game` must come from `catalog.games` (not a copy). */
export function locate(catalog: Catalog, game: Game): { chunk: CatalogChunk; row: number } | undefined {
  const at = catalog.games.indexOf(game)
  if (at < 0) return undefined
  const chunk = catalog.chunks.find((c) => at >= c.start && at < c.start + c.count)
  return chunk ? { chunk, row: at - chunk.start } : undefined
}

/** Game → description for the chunks loaded so far; `descriptions[i]` belongs to `catalog.chunks[i]`. */
export function descriptionLookup(
  catalog: Catalog | undefined,
  descriptions: readonly (readonly string[] | undefined)[],
): ReadonlyMap<Game, string> | undefined {
  if (!catalog) return undefined
  const lookup = new Map<Game, string>()
  catalog.chunks.forEach((chunk, i) => {
    const list = descriptions[i]
    if (!list) return
    for (let row = 0; row < chunk.count; row++) lookup.set(catalog.games[chunk.start + row], list[row])
  })
  return lookup
}

/** What goes into IndexedDB: the public catalog queries, and only the descriptions the current catalog names. */
export function shouldPersistQuery(key: QueryKey, catalog: Catalog | undefined): boolean {
  switch (key[0]) {
    case 'db':
    case 'deleted':
    case 'count-history':
      return true
    case 'desc':
      return !!catalog && catalog.chunks.some((c) => c.desc === key[1])
    default:
      return false
  }
}

export function isStaleDescription(key: QueryKey, catalog: Catalog): boolean {
  return key[0] === 'desc' && !catalog.chunks.some((c) => c.desc === key[1])
}
