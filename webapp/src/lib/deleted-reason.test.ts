import { describe, expect, it } from 'vitest'
import { REMOVAL_REASONS, reasonKey } from './deleted-reason'

describe('reasonKey', () => {
  it('maps the pipeline reasons (scripts/refresh.py) to their labels', () => {
    expect(reasonKey('Game page no longer exists (HTTP 404)')).toBe('deleted.reason.gone')
    expect(reasonKey('Game page no longer exists (HTTP 410)')).toBe('deleted.reason.gone')
    expect(reasonKey('Game became paid')).toBe('deleted.reason.paid')
    expect(reasonKey('Game page is password-protected')).toBe('deleted.reason.private')
  })

  it('gives every reason the admin offers a label of its own', () => {
    const keys = REMOVAL_REASONS.map(reasonKey)
    expect(keys).not.toContain(null)
    expect(new Set(keys).size).toBe(REMOVAL_REASONS.length)
    expect(reasonKey('Removed at the creator’s request')).toBe('deleted.reason.request')
  })

  it('leaves any other reason to be shown as written', () => {
    expect(reasonKey('Spam from a bot account')).toBeNull()
  })
})
