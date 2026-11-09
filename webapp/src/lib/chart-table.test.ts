import { describe, expect, it } from 'vitest'
import { historyRows, tableRows, treemapRows } from './chart-table'

describe('chart data tables', () => {
  it('keeps the chart order and adds shares only for a whole', () => {
    const entries = [
      { key: 'Released', count: 30 },
      { key: 'Prototype', count: 10 },
    ]
    expect(tableRows(entries)).toEqual([
      { key: 'Released', count: 30, share: null },
      { key: 'Prototype', count: 10, share: null },
    ])
    expect(tableRows(entries, 40)).toEqual([
      { key: 'Released', count: 30, share: 0.75 },
      { key: 'Prototype', count: 10, share: 0.25 },
    ])
    // An empty pie has no shares to give.
    expect(tableRows([{ key: 'None', count: 0 }], 0)).toEqual([{ key: 'None', count: 0, share: null }])
  })

  it('turns the history and the treemap into rows', () => {
    expect(historyRows([{ date: '2026-11-08', total: 5800 }, { date: '2026-11-09', total: 5828 }])).toEqual([
      { key: '2026-11-08', count: 5800, share: null },
      { key: '2026-11-09', count: 5828, share: null },
    ])
    expect(treemapRows([{ name: 'Puzzle', size: 12 }])).toEqual([{ key: 'Puzzle', count: 12, share: null }])
  })
})
