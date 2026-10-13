import { describe, expect, it } from 'vitest'
import type { CheckResult } from './api'
import { groupOf, groupResults } from './check-groups'

const r = (outcome: string, url: string | null, status: CheckResult['status'] = null): CheckResult => ({
  input: url ?? 'x',
  url,
  outcome,
  status,
})

describe('check groups', () => {
  it('says what Add would do with each URL', () => {
    expect(groupOf(r('queued', 'u'))).toBe('new')
    expect(groupOf(r('duplicate_pending', 'u', 'pending'))).toBe('waiting')
    expect(groupOf(r('duplicate_pending', 'u', 'failed'))).toBe('waiting')
    expect(groupOf(r('duplicate_pending', 'u', 'queued'))).toBe('queued')
    expect(groupOf(r('duplicate_catalog', 'u'))).toBe('catalog')
    expect(groupOf(r('previously_deleted', 'u'))).toBe('removed')
    expect(groupOf(r('rejected', 'u'))).toBe('rejected')
    expect(groupOf(r('invalid_url', null))).toBe('invalid')
  })

  it('groups results in input order and drops repeats', () => {
    const groups = groupResults([r('queued', 'a'), r('duplicate_in_request', 'a'), r('queued', 'b'), r('invalid_url', null)])
    expect(groups.new).toEqual(['a', 'b'])
    expect(groups.invalid).toEqual(['x'])
    expect(groups.catalog).toEqual([])
  })
})
