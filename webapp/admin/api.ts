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

class ApiError extends Error {
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
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    redirect: 'manual',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.type === 'opaqueredirect' || res.status === 401) throw new SessionExpired()
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
  if (!res.ok) throw new ApiError(res.status, data.error ?? `http_${res.status}`, data.message)
  return data as T
}

export type CandidateStatus = 'pending' | 'rejected' | 'queued' | 'ingested' | 'failed'

export interface Candidate {
  url: string
  source: 'rss' | 'form' | 'ext' | 'admin'
  status: CandidateStatus
  title: string | null
  image_url: string | null
  genre_hint: string | null
  flags: string[]
  note: string | null
  submitter: string | null
  discovered_at: string
  decided_at: string | null
}

export interface Me {
  email: string
  writes: boolean
}

export interface Decision {
  sha: string | null
  approved: string[]
  skipped: { url: string; reason: string }[]
}

export interface AddResult {
  sha: string | null
  results: { input: string; url: string | null; outcome: string; approved: boolean; reason?: string }[]
}

export type GameEdit = Partial<Record<'safe_virus' | 'nsfw' | 'notes', string>>

export const adminApi = {
  me: () => api<Me>('GET', '/api/admin/me'),
  queue: (status: CandidateStatus) =>
    api<{ counts: Record<CandidateStatus, number>; items: Candidate[] }>(
      'GET',
      `/api/admin/queue?status=${status}&limit=500`,
    ),
  approve: (urls: string[], override: boolean) =>
    api<Decision>('POST', '/api/admin/queue/decide', { action: 'approve', urls, override }),
  reject: (urls: string[]) => api<{ rejected: string[] }>('POST', '/api/admin/queue/decide', { action: 'reject', urls }),
  add: (urls: string[], override: boolean) => api<AddResult>('POST', '/api/admin/add', { urls, override }),
  edit: (url: string, edit: GameEdit) => api<{ sha: string | null; edited: number }>('PATCH', '/api/admin/games', { url, edit }),
  remove: (url: string, reason: string) =>
    api<{ sha: string | null; removed: number }>('DELETE', '/api/admin/games', { url, reason }),
  restore: (url: string) => api<{ sha: string | null; queued: boolean }>('POST', '/api/admin/games/restore', { url }),
}

export function shortSha(sha: string | null): string {
  return sha ? sha.slice(0, 7) : 'no commit'
}

export function errorText(e: unknown): string {
  if (e instanceof SessionExpired) return e.message
  if (e instanceof ApiError) {
    const known: Record<string, string> = {
      forbidden: 'This account is not allowed to use the admin.',
      not_configured: 'The admin is not configured yet (Cloudflare Access / D1).',
      github_not_configured: 'Writes are off: the GitHub App is not configured.',
      needs_override: 'Previously removed — approve with override.',
    }
    return known[e.code] ?? e.message
  }
  return e instanceof Error ? e.message : String(e)
}
