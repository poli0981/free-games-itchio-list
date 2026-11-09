// WCAG 2.2 AA contrast of the design tokens (src/index.css, light and dark) and
// of the chart palette: 4.5:1 for text, 3:1 for the parts of controls and charts
// people need to see (field borders, the focus ring, chart marks). A colour
// change that breaks one of these fails CI with the pair and its ratio.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NEUTRAL, PALETTE, PALETTE_LABEL } from '../src/components/charts/palette.ts'
import { contrastRatio } from '../src/lib/color.ts'

const TEXT = 4.5
const NON_TEXT = 3

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/** The 6-digit colour tokens of one `selector { … }` block (alpha tokens skipped). */
function tokens(selector) {
  const start = css.indexOf(`\n${selector} {`)
  if (start < 0) throw new Error(`index.css: no ${selector} block`)
  const body = css.slice(start, css.indexOf('\n}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]))
}

const LIGHT = tokens(':root')
const THEMES = { light: LIGHT, dark: { ...LIGHT, ...tokens('.dark') } }

// [foreground token, background token]
const TEXT_PAIRS = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['foreground', 'popover'],
  ['foreground', 'muted'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'popover'],
  ['muted-foreground', 'muted'],
  ['muted-foreground', 'accent'],
  ['primary-foreground', 'primary'],
  ['primary-text', 'background'],
  ['primary-text', 'card'],
  ['primary-text', 'muted'],
  ['destructive', 'background'],
  ['destructive', 'card'],
  ['destructive-foreground', 'destructive-solid'],
  ['success', 'card'],
]

const NON_TEXT_PAIRS = [
  ['input', 'background'],
  ['input', 'card'],
  ['input', 'popover'],
  ['ring', 'background'],
  ['ring', 'card'],
  ['ring', 'popover'],
  ['primary', 'card'],
]

function failures(theme, pairs, min) {
  return pairs.flatMap(([fg, bg]) => {
    if (!theme[fg] || !theme[bg]) return [`missing --${fg} or --${bg}`]
    const ratio = contrastRatio(theme[fg], theme[bg])
    return ratio >= min ? [] : [`--${fg} on --${bg}: ${ratio.toFixed(2)}`]
  })
}

describe('design tokens (src/index.css)', () => {
  for (const [name, theme] of Object.entries(THEMES)) {
    it(`${name}: text reaches ${TEXT}:1`, () => {
      expect(failures(theme, TEXT_PAIRS, TEXT)).toEqual([])
    })
    it(`${name}: field borders, focus ring and accent reach ${NON_TEXT}:1`, () => {
      expect(failures(theme, NON_TEXT_PAIRS, NON_TEXT)).toEqual([])
    })
  }
})

describe('chart palette', () => {
  it(`every series colour reaches ${NON_TEXT}:1 on both themes' cards`, () => {
    const low = Object.entries(THEMES).flatMap(([name, theme]) =>
      [...PALETTE, NEUTRAL]
        .filter((color) => contrastRatio(color, theme.card) < NON_TEXT)
        .map((color) => `${color} on the ${name} card: ${contrastRatio(color, theme.card).toFixed(2)}`),
    )
    expect(low).toEqual([])
  })

  it(`labels drawn on a colour (the treemap) reach ${TEXT}:1`, () => {
    const low = PALETTE.map((color, i) => [color, PALETTE_LABEL[i], contrastRatio(color, PALETTE_LABEL[i])])
      .filter(([, , ratio]) => ratio < TEXT)
      .map(([color, label, ratio]) => `${label} on ${color}: ${ratio.toFixed(2)}`)
    expect(low).toEqual([])
  })
})
