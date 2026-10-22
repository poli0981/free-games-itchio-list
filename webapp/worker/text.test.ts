import { describe, expect, it } from 'vitest'
import { compareCodeUnits, decodeEntities, trimEnd } from './text'

describe('decodeEntities', () => {
  it('decodes decimal, hex and named references', () => {
    expect(decodeEntities('&#65;&#x42;&#X43; &lt;b&gt; Rock &amp; Roll&nbsp;')).toBe('ABC <b> Rock & Roll')
  })
})

describe('trimEnd', () => {
  it.each([
    ['/games/', '/', '/games'],
    ['/games///', '/', '/games'],
    ['/games', '/', '/games'],
    ['///', '/', ''],
    ['', '/', ''],
    ['c2lnbg==', '=', 'c2lnbg'],
  ])('%j without trailing %j', (text, char, expected) => {
    expect(trimEnd(text, char)).toBe(expected)
  })

  it('takes linear time on a long run that is not at the end (a /\\/+$/ regex did not)', () => {
    const path = `/${'/'.repeat(200_000)}x`
    expect(trimEnd(path, '/')).toBe(path)
  })
})

describe('compareCodeUnits', () => {
  it('orders like a bare sort(): code units, not the locale', () => {
    expect(['game_info_010.json', 'alpha', 'game_info_002.json', 'Zeta', 'b', 'B'].sort(compareCodeUnits)).toEqual([
      'B',
      'Zeta',
      'alpha',
      'b',
      'game_info_002.json',
      'game_info_010.json',
    ])
    expect(compareCodeUnits('same', 'same')).toBe(0)
  })
})
