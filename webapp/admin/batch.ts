/** Splitting long lists into the API's batch sizes and sending them one after another. */

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export interface BatchRun<T, R> {
  results: R[]
  /** The first batch that failed (nothing after it was sent), with its error. */
  failed: { batch: T[]; error: unknown } | null
  /** The batches not sent yet (the failed one first): retry by running them again. */
  remaining: T[][]
}

/**
 * Send `batches` one at a time (each is one commit / one request). Stops at the
 * first error, so a lost session or a GitHub outage never leaves half a list
 * silently skipped; the rest can be run again as it is.
 */
export async function runBatches<T, R>(
  batches: T[][],
  send: (batch: T[], index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<BatchRun<T, R>> {
  const results: R[] = []
  onProgress?.(0, batches.length)
  for (let i = 0; i < batches.length; i++) {
    try {
      results.push(await send(batches[i], i))
    } catch (error) {
      return { results, failed: { batch: batches[i], error }, remaining: batches.slice(i) }
    }
    onProgress?.(i + 1, batches.length)
  }
  return { results, failed: null, remaining: [] }
}
