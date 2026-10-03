/**
 * Catalog packs: the compact form the site and the apps read (since 4.2).
 *
 * A pack is a list of flat records stored by column, then deflate-raw
 * compressed by the build (vite-plugins/catalog-data.ts, which imports this
 * file) and served as `/data/pack/<sha256 prefix>.bin`. String columns with
 * few distinct values, and every string-list column, keep a dictionary and
 * store indexes. `manifest-v1.json` names the current files, so a file name
 * changes exactly when its bytes do and the files can be cached for good.
 *
 * Pure on purpose: no DOM, Node or `@/` imports. The encoder must stay
 * deterministic: file names are hashes of its output.
 */

export const PACK_VERSION = 1
/** A new format gets manifest-v2.json; keep emitting v1 while 4.2.x apps exist. */
export const MANIFEST_FILE = `manifest-v${PACK_VERSION}.json`

type PackValue = string | number | string[]
export type PackRecord = Record<string, PackValue>

/** null / -1 mark a record that lacks the key (optional fields such as added_at). */
type PlainColumn = { v: (string | number | null)[] }
type DictColumn = { d: string[]; i: number[] }
type ListColumn = { d: string[]; a: (number[] | null)[] }
type Column = PlainColumn | DictColumn | ListColumn

export interface Pack {
  v: typeof PACK_VERSION
  n: number
  c: Record<string, Column>
}

export interface PackManifest {
  v: typeof PACK_VERSION
  total_games: number
  last_updated: string
  /** In index.json order; `main` holds every field but `description`, `desc` the descriptions. */
  chunks: { count: number; main: string; desc: string }[]
  deleted: string
  history: string
}

// Also keeps out "__proto__" and friends.
const KEY = /^[a-z][a-z0-9_]*$/
const PACK_FILE = /^[0-9a-f]{16}\.bin$/

export function isPackFile(name: unknown): name is string {
  return typeof name === 'string' && PACK_FILE.test(name)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function encodeColumn(key: string, values: readonly unknown[]): Column {
  let strings = 0
  let lists = 0
  let numbers = 0
  for (const value of values) {
    if (value === undefined) continue
    if (typeof value === 'string') strings++
    else if (typeof value === 'number' && Number.isFinite(value)) numbers++
    else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) lists++
    else throw new Error(`pack: unsupported value in "${key}": ${JSON.stringify(value)}`)
  }
  if (lists > 0 && strings + numbers > 0) throw new Error(`pack: "${key}" mixes lists and single values`)

  if (lists > 0) {
    const dict = new Map<string, number>()
    const index = (s: string) => {
      let at = dict.get(s)
      if (at === undefined) dict.set(s, (at = dict.size))
      return at
    }
    const a = values.map((value) => (value === undefined ? null : (value as string[]).map(index)))
    return { d: [...dict.keys()], a }
  }

  if (numbers === 0) {
    const dict = new Map<string, number>()
    for (const value of values) if (value !== undefined && !dict.has(value as string)) dict.set(value as string, dict.size)
    if (dict.size * 2 < values.length) {
      return { d: [...dict.keys()], i: values.map((value) => (value === undefined ? -1 : dict.get(value as string)!)) }
    }
  }
  return { v: values.map((value) => (value === undefined ? null : (value as string | number))) }
}

/** Records → pack. Columns and dictionary entries keep first-seen order, so the output is deterministic. */
export function encodePack(records: readonly object[]): Pack {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const record of records) {
    if (!isObject(record)) throw new Error('pack: every record must be an object')
    for (const key of Object.keys(record)) {
      if (seen.has(key)) continue
      if (!KEY.test(key)) throw new Error(`pack: bad key ${JSON.stringify(key)}`)
      seen.add(key)
      keys.push(key)
    }
  }
  const rows = records as readonly Record<string, unknown>[]
  const c: Record<string, Column> = {}
  for (const key of keys) {
    c[key] = encodeColumn(
      key,
      rows.map((row) => (Object.hasOwn(row, key) ? row[key] : undefined)),
    )
  }
  return { v: PACK_VERSION, n: rows.length, c }
}

function fail(why: string): never {
  throw new Error(`pack: ${why}`)
}

function index(at: unknown, size: number): number {
  if (!Number.isInteger(at) || (at as number) < 0 || (at as number) >= size) fail(`index ${String(at)} out of range`)
  return at as number
}

function stringList(value: unknown, what: string): string[] {
  if (!Array.isArray(value) || !value.every((s) => typeof s === 'string')) fail(`${what} is not a list of strings`)
  return value
}

function column(value: unknown, n: number, what: string): unknown[] {
  if (!Array.isArray(value) || value.length !== n) fail(`column ${what} has the wrong length`)
  return value
}

/** Pack (already JSON-parsed) → records. Validates the whole shape; absent keys stay absent. */
export function decodePack(input: unknown): PackRecord[] {
  if (!isObject(input) || input.v !== PACK_VERSION) fail('unsupported version')
  const { n, c } = input
  if (!Number.isInteger(n) || (n as number) < 0) fail('bad record count')
  if (!isObject(c)) fail('missing columns')
  const rows: PackRecord[] = Array.from({ length: n as number }, () => ({}))
  for (const [key, col] of Object.entries(c)) {
    if (!KEY.test(key) || !isObject(col)) fail(`bad column ${JSON.stringify(key)}`)
    if ('v' in col) {
      const values = column(col.v, rows.length, key)
      values.forEach((value, row) => {
        if (value === null) return
        if (typeof value !== 'string' && typeof value !== 'number') fail(`bad value in ${key}`)
        rows[row][key] = value
      })
    } else if ('i' in col) {
      const dict = stringList(col.d, `${key} dictionary`)
      column(col.i, rows.length, key).forEach((at, row) => {
        if (at !== -1) rows[row][key] = dict[index(at, dict.length)]
      })
    } else if ('a' in col) {
      const dict = stringList(col.d, `${key} dictionary`)
      column(col.a, rows.length, key).forEach((list, row) => {
        if (list === null) return
        if (!Array.isArray(list)) fail(`bad list in ${key}`)
        rows[row][key] = list.map((at) => dict[index(at, dict.length)])
      })
    } else {
      fail(`unknown column kind for ${key}`)
    }
  }
  return rows
}

/** manifest-v1.json (already JSON-parsed) → a checked PackManifest. */
export function parseManifest(value: unknown): PackManifest {
  if (!isObject(value) || value.v !== PACK_VERSION) throw new Error('manifest: unsupported version')
  const { total_games, last_updated, chunks, deleted, history } = value
  if (!Number.isInteger(total_games) || typeof last_updated !== 'string' || !Array.isArray(chunks)) {
    throw new Error('manifest: bad shape')
  }
  const checked = chunks.map((chunk) => {
    if (!isObject(chunk) || !Number.isInteger(chunk.count) || (chunk.count as number) < 0) {
      throw new Error('manifest: bad chunk')
    }
    if (!isPackFile(chunk.main) || !isPackFile(chunk.desc)) throw new Error('manifest: bad file name')
    return { count: chunk.count as number, main: chunk.main, desc: chunk.desc }
  })
  if (!isPackFile(deleted) || !isPackFile(history)) throw new Error('manifest: bad file name')
  return { v: PACK_VERSION, total_games: total_games as number, last_updated, chunks: checked, deleted, history }
}
