/**
 * Admin writes to the repo, each as one commit built from the files at the
 * current head of main (commitWithRetry re-reads and rebuilds on a race).
 * Pure builders are exported for tests; the GitHub reads stay thin.
 * Commit messages never name the maintainer (their email stays in the
 * private D1 audit log): the repo and its history are public.
 */
import { canonicalize } from './canonical'
import {
  applyAdminChange,
  dumps,
  type CatalogFiles,
  type CatalogIndex,
  type CountPoint,
  type DeletedEntry,
  type FieldEdit,
  type Game,
} from './catalog'
import { commitWithRetry, listDir, readFile, type CommitInput, type GitHubEnv } from './github'

const TEMP_LINK = 'scripts/temp_link.json'
const DELETED_LOG = 'scripts/deleted_games.json'
const UNBLOCKED = 'scripts/state/unblocked.json'
const CHUNK_FILE = /^game_info_\d+\.json$/

type Change = Omit<CommitInput, 'expectedHeadOid'>

async function readJsonFile<T>(env: GitHubEnv, path: string, head: string, fallback: T): Promise<T> {
  const text = await readFile(env, path, head)
  return text === null ? fallback : (JSON.parse(text) as T)
}

/** The catalog files at `head`, chunks in the same order as data_store.py. */
async function readCatalog(env: GitHubEnv, head: string): Promise<CatalogFiles> {
  const names = (await listDir(env, 'data_game', head)).filter((n) => CHUNK_FILE.test(n)).sort()
  const [chunks, index, history, deleted] = await Promise.all([
    Promise.all(names.map((n) => readJsonFile<Game[]>(env, `data_game/${n}`, head, []))),
    readJsonFile<CatalogIndex | null>(env, 'data_game/index.json', head, null),
    readJsonFile<CountPoint[]>(env, 'data_game/count_history.json', head, []),
    readJsonFile<DeletedEntry[]>(env, DELETED_LOG, head, []),
  ])
  return { chunks, index, history, deleted }
}

/**
 * temp_link.json with `urls` appended (skipping ones already queued in any
 * spelling). Unknown entries are kept as they are; apply_patch.py cleans them.
 */
export function withQueued(queueText: string | null, urls: string[]): { text: string; added: string[] } {
  const parsed: unknown = queueText === null ? [] : JSON.parse(queueText)
  const queue: unknown[] = Array.isArray(parsed) ? parsed : []
  const present = new Set(queue.map((u) => (typeof u === 'string' ? (canonicalize(u) ?? u) : '')))
  const added: string[] = []
  for (const url of urls) {
    if (present.has(url)) continue
    present.add(url)
    added.push(url)
  }
  return { text: dumps([...queue, ...added]), added }
}

/**
 * scripts/state/unblocked.json with `urls` added: removed games the maintainer
 * allows back in. update_info.py scrapes them despite the deleted log and drops
 * the log entry only when the game is really re-added (a still-paid or dead
 * game keeps its public removal record).
 */
export function withUnblocked(currentText: string | null, urls: string[]): { text: string; added: number } {
  const parsed: unknown = currentText === null ? [] : JSON.parse(currentText)
  const current = Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === 'string') : []
  const next = [...new Set([...current, ...urls])].sort()
  return { text: dumps(next), added: next.length - current.length }
}

/**
 * Queue `urls` for the ingest workflow (the push to temp_link.json triggers
 * update.yml). With `unblock`, also let those previously removed games
 * through the ingest (see withUnblocked).
 */
export async function queueForIngest(
  env: GitHubEnv,
  urls: string[],
  unblock: string[],
): Promise<{ sha: string | null; added: string[] }> {
  let added: string[] = []
  const sha = await commitWithRetry(env, async (head): Promise<Change | null> => {
    const writes = new Map<string, string>()
    const queued = withQueued(await readFile(env, TEMP_LINK, head), urls)
    added = queued.added
    if (queued.added.length > 0) writes.set(TEMP_LINK, queued.text)
    if (unblock.length > 0) {
      const allowed = withUnblocked(await readFile(env, UNBLOCKED, head), unblock)
      if (allowed.added > 0) writes.set(UNBLOCKED, allowed.text)
    }
    if (writes.size === 0) return null
    return {
      headline: `Queue ${urls.length} game(s) for ingest [admin]`,
      body: `Via the admin page.\n\n${urls.join('\n')}`,
      writes,
    }
  })
  return { sha, added }
}

export interface CatalogEditResult {
  sha: string | null
  summary: { edited: number; removed: number }
  /** Thumbnails of removed games (their resized copies are deleted from R2). */
  thumbnails: string[]
}

/** Edit maintainer fields and/or remove games in one commit. */
export async function editCatalog(
  env: GitHubEnv,
  edits: Map<string, FieldEdit>,
  removals: { url: string; reason: string }[],
  now: () => Date = () => new Date(),
): Promise<CatalogEditResult> {
  let result: CatalogEditResult = { sha: null, summary: { edited: 0, removed: 0 }, thumbnails: [] }
  const sha = await commitWithRetry(env, async (head): Promise<Change | null> => {
    const files = await readCatalog(env, head)
    const removing = new Set(removals.map((r) => r.url))
    const thumbnails = files.chunks
      .flat()
      .filter((g) => removing.has(g.url) && typeof g.thumbnail === 'string' && g.thumbnail.startsWith('https://'))
      .map((g) => g.thumbnail as string)
    const change = applyAdminChange(files, edits, removals, now())
    result = { sha: null, summary: change.summary, thumbnails }
    if (change.writes.size === 0 && change.deletes.length === 0) return null
    const parts = [
      change.summary.edited ? `edit ${change.summary.edited}` : '',
      change.summary.removed ? `remove ${change.summary.removed}` : '',
    ].filter(Boolean)
    const lines = [
      ...[...edits].map(([url, edit]) => `edit ${url} ${JSON.stringify(edit)}`),
      ...removals.map((r) => `remove ${r.url} (${r.reason})`),
    ]
    return {
      headline: `Catalog: ${parts.join(', ')} [admin]`,
      body: `Via the admin page.\n\n${lines.join('\n')}`,
      writes: change.writes,
      deletes: change.deletes,
    }
  })
  return { ...result, sha }
}
