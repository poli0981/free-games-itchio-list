import { describe, expect, it } from 'vitest'
import { hashId, routeFocusTarget, type RouteSpot } from './route-focus'

const at = (pathname: string, search = '', hash = ''): RouteSpot => ({ pathname, search, hash })

describe('routeFocusTarget', () => {
  it('leaves focus alone on the first render', () => {
    expect(routeFocusTarget(null, at('/games'))).toBeNull()
    expect(routeFocusTarget(null, at('/about', '', '#support'))).toBeNull()
  })

  it('leaves focus alone when only the query string changes', () => {
    expect(routeFocusTarget(at('/games'), at('/games', '?q=cat'))).toBeNull()
    expect(routeFocusTarget(at('/games', '?page=2'), at('/games', '?page=3'))).toBeNull()
    expect(routeFocusTarget(at('/games', '?genre=Puzzle'), at('/games'))).toBeNull()
  })

  it('moves focus to the heading when the path changes', () => {
    expect(routeFocusTarget(at('/games'), at('/games/some-game'))).toEqual({ kind: 'heading' })
    expect(routeFocusTarget(at('/games/some-game'), at('/games', '?q=cat'))).toEqual({ kind: 'heading' })
    // A redirect (/deleted → /removed) is a path change too.
    expect(routeFocusTarget(at('/deleted'), at('/removed'))).toEqual({ kind: 'heading' })
  })

  it('moves focus to the section a new hash points at', () => {
    expect(routeFocusTarget(at('/'), at('/about', '', '#support'))).toEqual({ kind: 'hash', id: 'support' })
    expect(routeFocusTarget(at('/about'), at('/about', '', '#support'))).toEqual({ kind: 'hash', id: 'support' })
  })

  it('ignores an unchanged hash and an empty one', () => {
    expect(routeFocusTarget(at('/about', '', '#support'), at('/about', '?x=1', '#support'))).toBeNull()
    expect(routeFocusTarget(at('/'), at('/about', '', '#'))).toEqual({ kind: 'heading' })
  })
})

describe('hashId', () => {
  it('strips the # and decodes the id', () => {
    expect(hashId('#support')).toBe('support')
    expect(hashId('support')).toBe('support')
    expect(hashId('#h%C3%B6')).toBe('hö')
    expect(hashId('')).toBe('')
    expect(hashId('#')).toBe('')
  })

  it('keeps a malformed escape as written', () => {
    expect(hashId('#50%')).toBe('50%')
  })
})
