import { describe, expect, it } from 'vitest'
import { legacyHashTarget } from './legacy'

const ORIGIN = 'https://freeitchgames.win'

describe('legacyHashTarget', () => {
  it.each([
    ['#/games/dev-itch-io-x', `${ORIGIN}/games/dev-itch-io-x`],
    ['#/games?q=vn&page=2', `${ORIGIN}/games?q=vn&page=2`],
    ['#/about#licenses', `${ORIGIN}/about#licenses`],
    ['#/add', '/'],
    ['#/workflows', '/'],
  ])('rewrites %s', (hash, expected) => {
    expect(legacyHashTarget(hash, ORIGIN)).toBe(expected)
  })

  it.each(['#//evil.com/x', '#/\\evil.com', '#//[', '#/.//evil.com'])(
    'sends crafted hash %s home instead of to another origin',
    (hash) => {
      const target = legacyHashTarget(hash, ORIGIN)
      expect(target === '/' || new URL(target!, ORIGIN).origin === ORIGIN).toBe(true)
      expect(new URL(target!, ORIGIN).pathname.startsWith('//')).toBe(false)
    },
  )

  it.each(['', '#', '#section', '#!/x'])('leaves other hashes alone (%s)', (hash) => {
    expect(legacyHashTarget(hash, ORIGIN)).toBeNull()
  })
})
