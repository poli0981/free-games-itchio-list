/**
 * Batches the maintainer queued (Add, Queue approvals, Restore), kept in this
 * browser so their ingest can be followed after a reload: the Add page asks
 * /api/admin/track how each game ended.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TrackItem } from './api'

export interface TrackedBatch {
  id: string
  label: string
  /** When it was queued (server time): only outcomes after it count. */
  at: string
  urls: string[]
}

const MAX_BATCHES = 20
const MAX_URLS = 10_000

/** Newest first, at most 20 batches and 10,000 URLs in all. */
export function capBatches(batches: TrackedBatch[]): TrackedBatch[] {
  const out: TrackedBatch[] = []
  let urls = 0
  for (const b of batches) {
    if (out.length >= MAX_BATCHES || urls + b.urls.length > MAX_URLS) break
    out.push(b)
    urls += b.urls.length
  }
  return out
}

interface TrackingState {
  batches: TrackedBatch[]
  track: (label: string, at: string, urls: string[]) => void
  forget: (id: string) => void
}

export const useTracking = create<TrackingState>()(
  persist(
    (set) => ({
      batches: [],
      track: (label, at, urls) =>
        set((s) =>
          urls.length === 0
            ? s
            : { batches: capBatches([{ id: `${at}-${Math.random().toString(36).slice(2, 8)}`, label, at, urls }, ...s.batches]) },
        ),
      forget: (id) => set((s) => ({ batches: s.batches.filter((b) => b.id !== id) })),
    }),
    { name: 'admin.batches' },
  ),
)

export interface TrackSummary {
  added: number
  waiting: number
  dropped: number
  unknown: number
}

export function summarize(items: TrackItem[]): TrackSummary {
  const out: TrackSummary = { added: 0, waiting: 0, dropped: 0, unknown: 0 }
  for (const i of items) out[i.state] += 1
  return out
}
