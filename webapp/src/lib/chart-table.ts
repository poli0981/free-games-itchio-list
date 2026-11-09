import type { CountEntry, TreemapNode } from './analytics'
import type { CountHistoryPoint } from '@/types/game'

/** One row of a chart's data table (components/charts/chart-card.tsx). */
export interface TableRow {
  key: string
  count: number
  /** The row's part of the whole, when the chart's parts make one (a pie); else null. */
  share: number | null
}

/**
 * A chart's data as table rows, in the chart's own order. Pass `total` when
 * the values add up to a whole (most pies) to get each row's share; leave it
 * out when one game counts in several rows (platforms, tags).
 */
export function tableRows(entries: readonly CountEntry[], total?: number): TableRow[] {
  return entries.map(({ key, count }) => ({ key, count, share: total ? count / total : null }))
}

/** The catalog size history (date → games) as rows, oldest first like the line chart. */
export function historyRows(history: readonly CountHistoryPoint[]): TableRow[] {
  return history.map(({ date, total }) => ({ key: date, count: total, share: null }))
}

/** Treemap cells (name, size) as rows. */
export function treemapRows(nodes: readonly TreemapNode[]): TableRow[] {
  return nodes.map(({ name, size }) => ({ key: name, count: size, share: null }))
}
