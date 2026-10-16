/**
 * Client for the Worker's /api/admin/* (worker/admin.ts). Same-origin only;
 * the Cloudflare Access cookie authenticates. When the Access session ends,
 * Access answers with a redirect to its login page — surfaced as
 * SessionExpired so the page can ask for a reload instead of failing oddly.
 */

export class SessionExpired extends Error {
  constructor() {
    super('Your admin session has expired.')
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message?: string) {
    super(message ?? code)
    this.status = status
    this.code = code
  }
}

// Set once any request finds the Access session gone; the app shows a sign-in banner.
let expired = false
const listeners = new Set<() => void>()

export function markSessionExpired(): void {
  if (expired) return
  expired = true
  for (const listener of listeners) listener()
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isSessionExpired(): boolean {
  return expired
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      redirect: 'manual',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'network_error')
  }
  if (res.type === 'opaqueredirect' || res.status === 401) throw new SessionExpired()
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
  if (!res.ok) throw new ApiError(res.status, data.error ?? `http_${res.status}`, data.message)
  return data as T
}

export type CandidateStatus = 'pending' | 'rejected' | 'queued' | 'ingested' | 'failed'
export type CandidateSource = 'rss' | 'form' | 'admin'

export interface Candidate {
  url: string
  source: CandidateSource
  status: CandidateStatus
  title: string | null
  image_url: string | null
  genre_hint: string | null
  flags: string[]
  note: string | null
  submitter: string | null
  discovered_at: string
  decided_at: string | null
  decided_by: string | null
  /** How the last ingest ended (added, paid, dead, private, …, timeout). */
  outcome: string | null
  outcome_at: string | null
}

export interface Me {
  email: string
  writes: boolean
  /** "owner/name" of the data repository, for commit links. */
  repo: string | null
}

export interface Decision {
  sha: string | null
  approved: string[]
  skipped: { url: string; reason: string }[]
  at: string
}

export interface CheckResult {
  input: string
  url: string | null
  outcome: string
  /** The queue status of a URL the queue already knows. */
  status: CandidateStatus | null
  reason?: string
}

export interface AddResult {
  sha: string | null
  at: string
  results: { input: string; url: string | null; outcome: string; approved: boolean; reason?: string }[]
}

export interface TrackItem {
  url: string
  state: 'waiting' | 'added' | 'dropped' | 'unknown'
  outcome?: string
  at?: string
  attempts?: number
  error?: string | null
}

export type GameEdit = Partial<Record<'safe_virus' | 'nsfw' | 'notes', string>>

export interface RemoveResult {
  sha: string | null
  removed: string[]
  notFound: string[]
  invalid: string[]
  covers: { deleted: number; failed: number }
  warnings: string[]
}

export interface BulkEditResult {
  sha: string | null
  edited: string[]
  unchanged: string[]
  notFound: string[]
}

export interface AuditRow {
  id: number
  at: string
  actor: string
  action: string
  target: string | null
  commit_sha: string | null
  detail: string | null
}

export interface Automation {
  enabled: boolean
  sources: CandidateSource[]
  hours: number
  since: string
}

interface LastRun {
  at: string
  approved: number
  added: number
  review: number
  duplicates: number
  pages: number
  sha: string | null
  errors: string[]
  collections: { id: string; status: number | null; found: number; added: number; next_page: number }[]
}

export interface WatchedCollection {
  id: string
  slug: string
  enabled: number
  added_at: string
  last_polled_at: string | null
  last_status: number | null
  backoff_until: string | null
  next_page: number
  last_found: number | null
  last_added: number | null
}

export interface SettingsData {
  automation: Automation
  lastRun: LastRun | null
  collections: WatchedCollection[]
  writes: boolean
}

export interface CollectionItem {
  url: string
  title: string
  image: string | null
  genre: string | null
  price: string | null
}

export interface CollectionRead {
  collection: { id: string; slug: string; url: string }
  items: CollectionItem[]
  pages: number
  nextPage: number | null
  /** Set when the read stopped early on an error, after some pages. */
  stopped?: string
}

export const adminApi = {
  me: () => api<Me>('GET', '/api/admin/me'),
  queue: (status: CandidateStatus) =>
    api<{ counts: Record<CandidateStatus, number>; items: Candidate[] }>('GET', `/api/admin/queue?status=${status}&limit=500`),
  approve: (urls: string[], override: boolean) =>
    api<Decision>('POST', '/api/admin/queue/decide', { action: 'approve', urls, override }),
  reject: (urls: string[]) => api<{ rejected: string[] }>('POST', '/api/admin/queue/decide', { action: 'reject', urls }),
  check: (urls: string[]) => api<{ results: CheckResult[] }>('POST', '/api/admin/check', { urls }),
  add: (urls: string[], override: boolean, via?: string) =>
    api<AddResult>('POST', '/api/admin/add', { urls, override, ...(via ? { via } : {}) }),
  track: (urls: string[], since: string) => api<{ head: string; items: TrackItem[] }>('POST', '/api/admin/track', { urls, since }),
  edit: (url: string, edit: GameEdit) => api<{ sha: string | null; edited: number }>('PATCH', '/api/admin/games', { url, edit }),
  editMany: (edits: { url: string; edit: GameEdit }[]) => api<BulkEditResult>('PATCH', '/api/admin/games/bulk', { edits }),
  removeMany: (urls: string[], reason: string) => api<RemoveResult>('POST', '/api/admin/games/remove', { urls, reason }),
  restore: (url: string) => api<{ sha: string | null; queued: boolean; at: string }>('POST', '/api/admin/games/restore', { url }),
  activity: (params: { before?: number | null; actions?: string[] }) => {
    const q = new URLSearchParams({ limit: '50' })
    if (params.before) q.set('before', String(params.before))
    if (params.actions?.length) q.set('actions', params.actions.join(','))
    return api<{ items: AuditRow[]; next: number | null }>('GET', `/api/admin/activity?${q}`)
  },
  settings: () => api<SettingsData>('GET', '/api/admin/settings'),
  saveAutomation: (automation: Omit<Automation, 'since'> & { includeOlder?: boolean }) =>
    api<{ automation: Automation }>('PUT', '/api/admin/settings', { automation }),
  readCollection: (url: string, page: number) => api<CollectionRead>('POST', '/api/admin/collections/read', { url, page }),
  watch: (url: string) => api<{ collection: WatchedCollection }>('POST', '/api/admin/collections', { url }),
  toggleCollection: (id: string, enabled: boolean) =>
    api<{ collection: WatchedCollection }>('PATCH', '/api/admin/collections', { id, enabled }),
  unwatch: (id: string) => api<{ removed: boolean }>('DELETE', '/api/admin/collections', { id }),
}

export function shortSha(sha: string | null): string {
  return sha ? sha.slice(0, 7) : 'no commit'
}
