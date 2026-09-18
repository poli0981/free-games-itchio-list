/**
 * Catalog file logic for admin writes — a TypeScript port of
 * scripts/data_store.py + scripts/json_io.py. Pure functions only: the
 * GitHub layer reads the files at a commit, calls these, and commits the
 * result, so the repo stays the single source of truth.
 *
 * Kept byte-for-byte compatible with the Python pipeline (same chunk
 * placement policy, same `json.dumps(indent=4, ensure_ascii=False)` text);
 * both sides are tested against tests/fixtures/golden/.
 */

const CHUNK_SIZE = 500
const MIN_FILL = 250

/** The only fields a maintainer edits; everything else is scraper-owned. */
const EDITABLE_FIELDS = ['safe_virus', 'notes', 'nsfw'] as const
type EditableField = (typeof EDITABLE_FIELDS)[number]

const SAFE_VIRUS_VALUES = ['?', 'Yes', 'No', 'Caution'] as const
const NSFW_VALUES = ['Yes', 'No'] as const

export interface Game {
  url: string
  name?: string
  [field: string]: unknown
}

export interface CatalogIndex {
  total_games: number
  max_per_file: number
  last_updated: string
  files: { name: string; count: number }[]
}

export interface CountPoint {
  date: string
  total: number
}

export interface DeletedEntry {
  url: string
  name: string
  reason: string
  deleted_at: string
}

/** Same text as Python's json.dumps(data, ensure_ascii=False, indent=4). */
export function dumps(data: unknown): string {
  return JSON.stringify(data, null, 4)
}

function chunkName(index: number): string {
  return `game_info_${String(index).padStart(3, '0')}.json`
}

/**
 * Place `games` into chunks, keeping each game in its current chunk (port of
 * data_store.plan_chunks). New games go to the last chunk; the whole list is
 * re-sliced only when a chunk overflows or a non-last chunk under-fills.
 */
export function planChunks(
  oldChunks: Game[][],
  games: Game[],
  chunkSize = CHUNK_SIZE,
  minFill = MIN_FILL,
): Game[][] {
  const byUrl = new Map<string, Game>()
  for (const g of games) if (!byUrl.has(g.url)) byUrl.set(g.url, g)

  const placed = new Set<string>()
  let chunks: Game[][] = oldChunks.map((old) => {
    const chunk: Game[] = []
    for (const g of old) {
      const current = byUrl.get(g.url)
      if (current && !placed.has(g.url)) {
        chunk.push(current)
        placed.add(g.url)
      }
    }
    return chunk
  })

  const fresh = [...byUrl.values()].filter((g) => !placed.has(g.url))
  if (fresh.length > 0) {
    if (chunks.length === 0) chunks.push([])
    chunks[chunks.length - 1].push(...fresh)
  }

  chunks = chunks.filter((c) => c.length > 0)
  const needsReslice =
    chunks.some((c) => c.length > chunkSize) || chunks.slice(0, -1).some((c) => c.length < minFill)
  if (needsReslice) {
    const flat = chunks.flat()
    chunks = []
    for (let i = 0; i < flat.length; i += chunkSize) chunks.push(flat.slice(i, i + chunkSize))
  }
  return chunks
}

/** index.json content; `last_updated` moves only when data or layout changed. */
export function buildIndex(
  chunks: Game[][],
  previous: Partial<CatalogIndex> | null,
  dataChanged: boolean,
  now: Date,
): CatalogIndex {
  const files = chunks.map((c, i) => ({ name: chunkName(i + 1), count: c.length }))
  const total = files.reduce((sum, f) => sum + f.count, 0)
  const layoutChanged =
    JSON.stringify(previous?.files) !== JSON.stringify(files) || previous?.total_games !== total
  const lastUpdated =
    dataChanged || layoutChanged || !previous?.last_updated
      ? now.toISOString().replace(/\.\d{3}Z$/, 'Z')
      : previous.last_updated
  return { total_games: total, max_per_file: CHUNK_SIZE, last_updated: lastUpdated, files }
}

/** Date-keyed upsert; a day whose total equals the last recorded one adds no row. */
export function upsertCountHistory(history: CountPoint[], total: number, now: Date): CountPoint[] {
  const today = now.toISOString().slice(0, 10)
  const rows = history.map((r) => ({ ...r })).sort((a, b) => a.date.localeCompare(b.date))
  const existing = rows.find((r) => r.date === today)
  if (existing) {
    existing.total = total
    return rows
  }
  if (rows.length > 0 && rows[rows.length - 1].total === total) return rows
  return [...rows, { date: today, total }]
}

/** Keep the earliest deleted_at per URL, sorted by deleted_at (dedup_deleted). */
export function dedupDeleted(entries: DeletedEntry[]): DeletedEntry[] {
  const byUrl = new Map<string, DeletedEntry>()
  for (const e of entries) {
    if (!e.url) continue
    const current = byUrl.get(e.url)
    if (!current || e.deleted_at < current.deleted_at) byUrl.set(e.url, e)
  }
  return [...byUrl.values()].sort((a, b) => a.deleted_at.localeCompare(b.deleted_at))
}

export type FieldEdit = Partial<Record<EditableField, string>>

/** Validate an admin edit; returns an error message or null. */
export function validateEdit(edit: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(edit)) {
    if (!(EDITABLE_FIELDS as readonly string[]).includes(key)) return `field '${key}' is not editable`
    if (typeof value !== 'string') return `field '${key}' must be a string`
    if (key === 'safe_virus' && !(SAFE_VIRUS_VALUES as readonly string[]).includes(value))
      return `safe_virus must be one of ${SAFE_VIRUS_VALUES.join(', ')}`
    if (key === 'nsfw' && !(NSFW_VALUES as readonly string[]).includes(value))
      return `nsfw must be one of ${NSFW_VALUES.join(', ')}`
    if (key === 'notes' && value.length > 2000) return 'notes is limited to 2000 characters'
  }
  return null
}

export interface CatalogFiles {
  chunks: Game[][]
  index: CatalogIndex | null
  history: CountPoint[]
  deleted: DeletedEntry[]
}

export interface CatalogChange {
  /** path → new file text (only files whose text changed). */
  writes: Map<string, string>
  /** paths to delete (chunks that disappeared). */
  deletes: string[]
  summary: { edited: number; removed: number }
}

/**
 * Apply edits and removals to the catalog as read at one commit. Produces
 * exactly the file texts the Python pipeline would write for the same change.
 */
export function applyAdminChange(
  files: CatalogFiles,
  edits: Map<string, FieldEdit>,
  removals: { url: string; reason: string }[],
  now: Date,
  sizes: { chunkSize: number; minFill: number } = { chunkSize: CHUNK_SIZE, minFill: MIN_FILL },
): CatalogChange {
  const games = files.chunks.flat().map((g) => ({ ...g }))
  let edited = 0
  for (const g of games) {
    const edit = edits.get(g.url)
    if (!edit) continue
    let changed = false
    for (const [key, value] of Object.entries(edit)) {
      if (g[key] !== value) {
        g[key] = value
        changed = true
      }
    }
    if (changed) edited++
  }

  const removeUrls = new Map(removals.map((r) => [r.url, r.reason]))
  const stamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const deletedEntries: DeletedEntry[] = []
  const kept = games.filter((g) => {
    const reason = removeUrls.get(g.url)
    if (reason === undefined) return true
    deletedEntries.push({ url: g.url, name: String(g.name ?? 'N/A'), reason, deleted_at: stamp })
    return false
  })

  const writes = new Map<string, string>()
  const newChunks = planChunks(files.chunks, kept, sizes.chunkSize, sizes.minFill)
  const oldTexts = files.chunks.map((c) => dumps(c))
  let dataChanged = false
  newChunks.forEach((chunk, i) => {
    const text = dumps(chunk)
    if (oldTexts[i] !== text) {
      writes.set(`data_game/${chunkName(i + 1)}`, text)
      dataChanged = true
    }
  })
  const deletes: string[] = []
  for (let i = newChunks.length; i < files.chunks.length; i++) {
    deletes.push(`data_game/${chunkName(i + 1)}`)
    dataChanged = true
  }

  const index = buildIndex(newChunks, files.index, dataChanged, now)
  if (!files.index || dumps(files.index) !== dumps(index)) writes.set('data_game/index.json', dumps(index))
  const history = upsertCountHistory(files.history, index.total_games, now)
  if (dumps(history) !== dumps(files.history)) writes.set('data_game/count_history.json', dumps(history))
  if (deletedEntries.length > 0) {
    writes.set('scripts/deleted_games.json', dumps(dedupDeleted([...files.deleted, ...deletedEntries])))
  }
  return { writes, deletes, summary: { edited, removed: deletedEntries.length } }
}
