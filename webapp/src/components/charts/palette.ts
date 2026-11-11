import { readableOn } from '@/lib/color'

// Shared chart colour palette. Kept in its own file so chart-card.tsx
// stays a component-only module (React Fast Refresh friendly).
// Every colour keeps 3:1 against the card in both themes (WCAG 1.4.11; the
// green, amber, sky, orange and emerald were darkened for the light card) —
// src/contrast.test.ts checks it.
export const PALETTE = [
  '#7c5cff', // the brand purple (--brand)
  '#ec4699',
  '#1b9d4a',
  '#c76c05',
  '#3c83f6',
  '#0b84bc',
  '#e9560c',
  '#2a9d90',
  '#af57db',
  '#238b68',
]

/** Label colour for text drawn on each palette colour (the treemap cells), 4.5:1 or better. */
export const PALETTE_LABEL = PALETTE.map((color) => readableOn(color))

/** "Unknown / not disclosed" slices: a mid gray that reads on both themes' cards. */
export const NEUTRAL = '#6b6b74'

/**
 * A pie slice takes its colour from the `fill` of its data entry (Recharts'
 * `<Cell>` is deprecated and goes away in 4.0): the palette colours, in order.
 */
export function paletteFills<T extends object>(data: readonly T[]): (T & { fill: string })[] {
  return data.map((entry, i) => ({ ...entry, fill: PALETTE[i % PALETTE.length] }))
}
