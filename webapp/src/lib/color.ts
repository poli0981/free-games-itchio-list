// WCAG 2.x colour maths: the contrast checks in src/contrast.test.ts and the
// chart label colours (components/charts/palette.ts).

/** [r, g, b] (0–255) of a #rgb or #rrggbb colour. */
export function parseHex(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`not a #rgb / #rrggbb colour: ${hex}`)
  const digits = m[1].length === 3 ? [...m[1]].map((d) => d + d) : (m[1].match(/../g) ?? [])
  const [r, g, b] = digits.map((d) => Number.parseInt(d, 16))
  return [r, g, b]
}

/** Relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrast ratio between two colours, 1 to 21 (the order doesn't matter). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Whichever of two text colours reads better on `background` (near-black by default, or white). */
export function readableOn(background: string, dark = '#0b0b0c', light = '#ffffff'): string {
  return contrastRatio(dark, background) >= contrastRatio(light, background) ? dark : light
}
