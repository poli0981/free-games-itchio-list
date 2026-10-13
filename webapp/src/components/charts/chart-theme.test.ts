import { describe, expect, it } from 'vitest'

const CHARTS = import.meta.glob<string>('./*-chart.tsx', { query: '?raw', import: 'default', eager: true })

describe('chart series', () => {
  it('every Pie, Bar, Line and Treemap starts with the shared short animation', () => {
    const series = Object.entries(CHARTS).flatMap(([file, src]) =>
      [...src.matchAll(/<(Pie|Bar|Line|Treemap)\b(\s*)(\{\.\.\.SERIES_ANIMATION\})?/g)].map((m) => ({
        file,
        tag: m[1],
        animated: m[3] !== undefined,
      })),
    )
    expect(series.length).toBeGreaterThanOrEqual(16)
    expect(series.filter((s) => !s.animated)).toEqual([])
  })
})
