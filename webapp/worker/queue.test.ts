import { describe, expect, it } from 'vitest'
import { classify, type ClassifyContext } from './queue'

const ctx = (over: Partial<ClassifyContext> = {}): ClassifyContext => ({
  catalog: new Set(['https://dev.itch.io/in-catalog']),
  deleted: new Map([['https://dev.itch.io/gone', { reason: 'paid', deleted_at: '2026-06-19T03:00:00Z' }]]),
  known: new Map([
    ['https://dev.itch.io/waiting', 'pending'],
    ['https://dev.itch.io/approved', 'queued'],
    ['https://dev.itch.io/blocked', 'rejected'],
    ['https://dev.itch.io/broke', 'failed'],
  ]),
  ...over,
})

describe('classify', () => {
  it('assigns each outcome in precedence order', () => {
    const out = classify(
      [
        'not a url',
        'https://dev.itch.io/new',
        'HTTPS://DEV.itch.io/new/', // same game after canonicalization
        'https://dev.itch.io/in-catalog',
        'https://dev.itch.io/blocked',
        'https://dev.itch.io/waiting',
        'https://dev.itch.io/approved',
        'https://dev.itch.io/gone',
        'https://dev.itch.io/broke',
      ],
      ctx(),
    )
    expect(out.map((c) => [c.outcome, c.store])).toEqual([
      ['invalid_url', false],
      ['queued', true],
      ['duplicate_in_request', false],
      ['duplicate_catalog', false],
      ['rejected', false],
      ['duplicate_pending', false],
      ['duplicate_pending', false],
      ['previously_deleted', true],
      ['queued', true], // failed rows are reopened
    ])
    expect(out[1].canonical).toBe('https://dev.itch.io/new')
    expect(out[7].reason).toBe('paid (2026-06-19)')
  })

  it('checks the catalog before the blocklist and the deleted log', () => {
    const url = 'https://dev.itch.io/in-catalog'
    const out = classify([url], ctx({ known: new Map([[url, 'rejected']]), deleted: new Map() }))
    expect(out[0].outcome).toBe('duplicate_catalog')
  })

  it('keeps the caller input verbatim', () => {
    const [c] = classify(['  https://dev.itch.io/new?ref=x  '], ctx())
    expect(c.input).toBe('  https://dev.itch.io/new?ref=x  ')
  })
})
