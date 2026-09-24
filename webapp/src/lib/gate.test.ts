import { describe, expect, it } from 'vitest'
import { readHint, shouldReload } from './gate'

describe('readHint', () => {
  it.each([
    [null, null],
    ['', null],
    ['{', null],
    ['null', null],
    ['{"until":"soon"}', null],
    ['{"until":1790000000000}', 1790000000000],
  ])('%j → %j', (raw, until) => {
    expect(readHint(raw)).toBe(until)
  })
})

describe('shouldReload', () => {
  it('reloads only when the gate is on and this browser has no pass', () => {
    expect(shouldReload({ enabled: true, valid: false, ttl: 0 })).toBe(true)
    expect(shouldReload({ enabled: true, valid: true, ttl: 60 })).toBe(false)
    expect(shouldReload({ enabled: false, valid: true, ttl: 0 })).toBe(false)
    expect(shouldReload({ enabled: false, valid: false, ttl: 0 })).toBe(false)
  })
})
