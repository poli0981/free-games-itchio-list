import { describe, expect, it } from 'vitest'
import { capBatches, summarize, type TrackedBatch } from './tracking'

const batch = (n: number, size: number): TrackedBatch => ({
  id: String(n),
  label: `b${n}`,
  at: '2026-10-13T00:00:00Z',
  urls: Array.from({ length: size }, (_, i) => `https://dev.itch.io/g${n}-${i}`),
})

describe('tracked batches', () => {
  it('keeps the newest 20 batches and at most 10,000 URLs', () => {
    expect(capBatches(Array.from({ length: 25 }, (_, i) => batch(i, 1))).map((b) => b.id)).toEqual(
      Array.from({ length: 20 }, (_, i) => String(i)),
    )
    expect(capBatches([batch(1, 6000), batch(2, 5000), batch(3, 10)]).map((b) => b.id)).toEqual(['1'])
  })

  it('counts games per state', () => {
    expect(
      summarize([
        { url: 'a', state: 'added' },
        { url: 'b', state: 'added' },
        { url: 'c', state: 'dropped', outcome: 'paid' },
        { url: 'd', state: 'waiting' },
      ]),
    ).toEqual({ added: 2, waiting: 1, dropped: 1, unknown: 0 })
  })
})
