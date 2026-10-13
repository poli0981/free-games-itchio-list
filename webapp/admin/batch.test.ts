import { describe, expect, it, vi } from 'vitest'
import { chunk, runBatches } from './batch'

describe('batches', () => {
  it('splits a list into batches of a given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([], 200)).toEqual([])
  })

  it('sends batches one at a time and stops at the first error, keeping the rest', async () => {
    const progress = vi.fn()
    const send = vi.fn(async (batch: number[]) => {
      if (batch[0] === 3) throw new Error('down')
      return batch.length
    })
    const run = await runBatches([[1, 2], [3], [4]], send, progress)
    expect(run.results).toEqual([2])
    expect(run.failed?.batch).toEqual([3])
    expect(run.remaining).toEqual([[3], [4]])
    expect(send).toHaveBeenCalledTimes(2)
    expect(progress.mock.calls).toEqual([
      [0, 3],
      [1, 3],
    ])
    expect((await runBatches([[1]], async () => 'ok')).failed).toBeNull()
  })
})
