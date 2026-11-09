import { describe, expect, it } from 'vitest'
import { contrastRatio, parseHex, readableOn, relativeLuminance } from './color'

describe('colour maths', () => {
  it('parses #rgb and #rrggbb', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255])
    expect(parseHex('#7C5CFF')).toEqual([124, 92, 255])
    expect(() => parseHex('#7c5cff38')).toThrow()
    expect(() => parseHex('purple')).toThrow()
  })

  it('computes luminance and contrast like WCAG 2.x', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBe(1)
    expect(contrastRatio('#000', '#fff')).toBe(21)
    expect(contrastRatio('#fff', '#000')).toBe(21)
    expect(contrastRatio('#777777', '#777777')).toBe(1)
    // The classic borderline grey: #767676 passes 4.5:1 on white, #777777 doesn't.
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5)
  })

  it('picks the more readable label colour', () => {
    expect(readableOn('#ffffff')).toBe('#0b0b0c')
    expect(readableOn('#0b0b0c')).toBe('#ffffff')
    expect(readableOn('#3c83f6')).toBe('#0b0b0c')
    expect(readableOn('#1e1b4b', '#000000', '#fafafa')).toBe('#fafafa')
  })
})
