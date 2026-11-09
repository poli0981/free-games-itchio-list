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

describe('chart accessibility', () => {
  const sources = Object.entries(CHARTS)

  it('every chart is named after its card (chartAria)', () => {
    const containers = sources.flatMap(([file, src]) =>
      [...src.matchAll(/<(BarChart|LineChart|PieChart|Treemap)\b[^>]*?>/gs)].map((m) => ({ file, tag: m[0] })),
    )
    expect(containers.length).toBeGreaterThanOrEqual(16)
    expect(containers.filter((c) => !c.tag.includes('{...chartAria(')).map((c) => c.file)).toEqual([])
  })

  it('pies keep one tab stop (rootTabIndex={-1})', () => {
    const pies = sources.flatMap(([file, src]) =>
      [...src.matchAll(/<Pie\b[^>]*?>/gs)].map((m) => ({ file, tag: m[0] })),
    )
    expect(pies.length).toBeGreaterThanOrEqual(6)
    expect(pies.filter((p) => !p.tag.includes('rootTabIndex={-1}')).map((p) => p.file)).toEqual([])
  })

  it('every chart card offers its data as a table (the recent-deletions list is text already)', () => {
    const missing = sources
      .filter(([file]) => !file.includes('recent-deleted'))
      .filter(([, src]) => !src.includes('table={'))
      .map(([file]) => file)
    expect(missing).toEqual([])
  })
})
