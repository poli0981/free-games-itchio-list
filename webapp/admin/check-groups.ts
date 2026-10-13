/** The Add page's preview: each checked URL in the group that says what Add would do with it. */
import type { CheckResult } from './api'

export type CheckGroup = 'new' | 'waiting' | 'queued' | 'catalog' | 'removed' | 'rejected' | 'invalid'

export const GROUPS: { id: CheckGroup; label: string; hint: string }[] = [
  { id: 'new', label: 'New', hint: 'Added and queued for the ingest workflow.' },
  { id: 'waiting', label: 'Waiting in the queue', hint: 'Pending or failed before: approved too.' },
  { id: 'queued', label: 'Already queued', hint: 'Queued or just ingested: nothing to do.' },
  { id: 'catalog', label: 'In the catalog', hint: 'Nothing to do.' },
  { id: 'removed', label: 'Removed before', hint: 'Added only with override (it is re-checked; a still-paid game stays removed).' },
  { id: 'rejected', label: 'Rejected before', hint: 'Added only with override.' },
  { id: 'invalid', label: 'Not a game URL', hint: 'Skipped.' },
]

export function groupOf(r: CheckResult): CheckGroup {
  switch (r.outcome) {
    case 'queued':
      return 'new'
    case 'duplicate_pending':
      return r.status === 'pending' || r.status === 'failed' ? 'waiting' : 'queued'
    case 'duplicate_catalog':
    case 'duplicate_in_request':
      return 'catalog'
    case 'previously_deleted':
      return 'removed'
    case 'rejected':
      return 'rejected'
    default:
      return 'invalid'
  }
}

/** URLs per group, in input order; a URL listed twice counts once. */
export function groupResults(results: CheckResult[]): Record<CheckGroup, string[]> {
  const groups = Object.fromEntries(GROUPS.map((g) => [g.id, [] as string[]])) as Record<CheckGroup, string[]>
  for (const r of results) {
    if (r.outcome === 'duplicate_in_request') continue
    groups[groupOf(r)].push(r.url ?? r.input)
  }
  return groups
}
