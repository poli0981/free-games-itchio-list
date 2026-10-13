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
import { GITHUB_CONFIG, missingConfig, type WorkerEnv } from './env'
import { commitWithRetry, headOid, listDir, readFile, type CommitInput, type GitHubEnv } from './github'

const TEMP_LINK = 'scripts/temp_link.json'
const DELETED_LOG = 'scripts/deleted_games.json'
const UNBLOCKED = 'scripts/state/unblocked.json'
const INGEST_STATE = 'scripts/state/ingest_state.json'
const INGEST_OUTCOMES = 'scripts/state/ingest_outcomes.json'
const CHUNK_FILE = /^game_info_\d+\.json$/

type Change = Omit<CommitInput, 'expectedHeadOid'>

/** Who asked for a queue commit: the maintainer on the admin page, or its automatic rules (cron). */
export type QueueTag = 'admin' | 'auto'

/** Writes to the repo; injectable so tests don't talk to GitHub. */
export interface RepoOps {
  queueForIngest(urls: string[], unblock: string[], tag?: QueueTag): Promise<{ sha: string | null; added: string[] }>
  editCatalog(edits: Map<string, FieldEdit>, removals: { url: string; reason: string }[]): Promise<CatalogEditResult>
  ingestView(): Promise<IngestView>
}

/** The repo writer, or null when the GitHub App is not configured (read-only admin, no automation). */
export function repoOps(env: WorkerEnv): RepoOps | null {
  if (missingConfig(env, GITHUB_CONFIG).length > 0) return null
  const gh = env as WorkerEnv & GitHubEnv
  return {
    queueForIngest: (urls, unblock, tag) => queueForIngest(gh, urls, unblock, tag),
    editCatalog: (edits, removals) => editCatalog(gh, edits, removals),
    ingestView: () => readIngestView(gh),
  }
}

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

const QUEUE_BODY: Record<QueueTag, string> = {
  admin: 'Via the admin page.',
  auto: "By the admin page's automatic rules (auto-approve, watched collections).",
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
  tag: QueueTag = 'admin',
): Promise<{ sha: string | null; added: string[] }> {
  let added: string[] = []
  const sha = await commitWithRetry(env, async (head): Promise<Change | null> => {
    const writes = new Map<string, string>()
    const queued = withQueued(await readFile(env, TEMP_LINK, head), urls)
    added = queued.added
    if (queued.added.length > 0) writes.set(TEMP_LINK, queued.text)
    let unblocked = 0
    if (unblock.length > 0) {
      const allowed = withUnblocked(await readFile(env, UNBLOCKED, head), unblock)
      unblocked = allowed.added
      if (allowed.added > 0) writes.set(UNBLOCKED, allowed.text)
    }
    if (writes.size === 0) return null
    return {
      headline:
        added.length > 0
          ? `Queue ${added.length} game(s) for ingest [${tag}]`
          : `Unblock ${unblocked} removed game(s) [${tag}]`,
      body: `${QUEUE_BODY[tag]}\n\n${(added.length > 0 ? added : unblock).join('\n')}`,
      writes,
    }
  })
  return { sha, added }
}

export interface CatalogEditResult {
  sha: string | null
  summary: { edited: number; removed: number }
  /** Per URL: edited, already as asked, removed, or not in the catalog. */
  edited: string[]
  unchanged: string[]
  removed: string[]
  missing: string[]
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
  let result: CatalogEditResult = {
    sha: null,
    summary: { edited: 0, removed: 0 },
    edited: [],
    unchanged: [],
    removed: [],
    missing: [],
    thumbnails: [],
  }
  const sha = await commitWithRetry(env, async (head): Promise<Change | null> => {
    const files = await readCatalog(env, head)
    const removing = new Set(removals.map((r) => r.url))
    const thumbnails = files.chunks
      .flat()
      .filter((g) => removing.has(g.url) && typeof g.thumbnail === 'string' && g.thumbnail.startsWith('https://'))
      .map((g) => g.thumbnail as string)
    const change = applyAdminChange(files, edits, removals, now())
    result = { sha: null, summary: change.summary, ...change.urls, thumbnails }
    if (change.writes.size === 0 && change.deletes.length === 0) return null
    const parts = [
      change.summary.edited ? `edit ${change.summary.edited}` : '',
      change.summary.removed ? `remove ${change.summary.removed}` : '',
    ].filter(Boolean)
    const editedUrls = new Set(change.urls.edited)
    const removedUrls = new Set(change.urls.removed)
    const lines = [
      ...[...edits].filter(([url]) => editedUrls.has(url)).map(([url, edit]) => `edit ${url} ${JSON.stringify(edit)}`),
      ...removals.filter((r) => removedUrls.has(r.url)).map((r) => `remove ${r.url} (${r.reason})`),
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

/**
 * What the ingest pipeline knows about queued games, at one commit:
 * the queue itself, failed attempts (still retried) and final outcomes.
 */
export interface IngestView {
  head: string
  /** Canonical URLs still in scripts/temp_link.json. */
  queued: Set<string>
  attempts: Map<string, { attempts: number; error: string | null }>
  outcomes: Map<string, { outcome: string; at: string }>
}

function parsed(text: string | null): unknown {
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** The three pipeline files, read defensively (a malformed file counts as empty). */
export function parseIngestView(
  head: string,
  queueText: string | null,
  stateText: string | null,
  outcomesText: string | null,
): IngestView {
  const queue = parsed(queueText)
  const queued = new Set<string>()
  if (Array.isArray(queue)) {
    for (const item of queue) {
      const raw = isRecord(item) ? item.url : item
      const url = typeof raw === 'string' ? canonicalize(raw) : null
      if (url) queued.add(url)
    }
  }
  const attempts = new Map<string, { attempts: number; error: string | null }>()
  const state = parsed(stateText)
  if (isRecord(state)) {
    for (const [url, entry] of Object.entries(state)) {
      if (isRecord(entry) && typeof entry.attempts === 'number') {
        attempts.set(url, { attempts: entry.attempts, error: typeof entry.last_error === 'string' ? entry.last_error : null })
      }
    }
  }
  const outcomes = new Map<string, { outcome: string; at: string }>()
  const outcomeMap = parsed(outcomesText)
  if (isRecord(outcomeMap)) {
    for (const [url, entry] of Object.entries(outcomeMap)) {
      if (isRecord(entry) && typeof entry.outcome === 'string' && typeof entry.at === 'string') {
        outcomes.set(url, { outcome: entry.outcome, at: entry.at })
      }
    }
  }
  return { head, queued, attempts, outcomes }
}

// Per isolate, keyed by the head commit; only a resolved value is kept
// (gotcha 15: never share an in-flight promise across requests).
let viewCache: IngestView | undefined

export function resetIngestViewCache(): void {
  viewCache = undefined
}

/** The ingest view at the current head: one GitHub call while main has not moved, four when it has. */
export async function readIngestView(env: GitHubEnv): Promise<IngestView> {
  const head = await headOid(env)
  if (viewCache?.head === head) return viewCache
  const [queue, state, outcomes] = await Promise.all([
    readFile(env, TEMP_LINK, head),
    readFile(env, INGEST_STATE, head),
    readFile(env, INGEST_OUTCOMES, head),
  ])
  const view = parseIngestView(head, queue, state, outcomes)
  viewCache = view
  return view
}
