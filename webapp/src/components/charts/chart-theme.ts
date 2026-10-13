// Shared Recharts props. The design tokens in index.css are hex colours, so
// reference them as `var(--x)` — `hsl(var(--x))` is an invalid colour, which
// SVG paints black and CSS drops (a transparent tooltip).

/** Every <Tooltip>: no slide-in animation, no focus outline, above the legend. */
export const TOOLTIP_BASE = {
  isAnimationActive: false,
  wrapperStyle: { outline: 'none', zIndex: 10 },
} as const

/**
 * Every series (Bar, Pie, Line, Treemap): a short entrance that starts at once,
 * instead of Recharts' 400 ms wait and 1.5 s sweep. The Charts page keeps a tab's
 * charts mounted once shown, so this plays only the first time. 'auto' keeps
 * Recharts' own check of the reduced-motion setting.
 */
export const SERIES_ANIMATION = {
  isAnimationActive: 'auto',
  animationBegin: 0,
  animationDuration: 300,
  animationEasing: 'ease-out',
} as const

/** Hover band behind the active bar. */
export const BAR_CURSOR = { fill: 'var(--accent)' }

/** Hover guide on line charts. */
export const LINE_CURSOR = { stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }

/** Seams between pie slices in the card colour (Recharts draws white seams by default). */
export const SLICE_STROKE = 'var(--card)'

/**
 * Every pie <Legend>: the data's order (largest slice first) instead of Recharts'
 * alphabetical default, and labels in the muted text colour instead of the slice
 * colour, which fails contrast on the light theme; the swatch carries the colour.
 * Phones get smaller legend text in index.css.
 */
export const LEGEND_BASE = {
  itemSorter: null,
  labelStyle: { color: 'var(--muted-foreground)' },
} as const

/**
 * Tick text for a category axis whose labels must stay on one line. Recharts
 * wraps a label wider than the axis, measured in a DOM span styled with `style`
 * alone: without a size there, or with a unitless one, the span measures at the
 * 16px body size, so a 12px "Interactive Fiction" broke in two and ran into its
 * neighbours in the 15 thin rows of the Genres chart.
 */
export function singleLineTick(fontSize: number) {
  return { fontSize, style: { fontSize: `${fontSize}px` } }
}

/** Shortens category labels longer than `max` characters (ticks, treemap cells); tooltips keep the whole name. */
export function truncateLabel(max: number): (value: string) => string {
  return (value) => (value.length > max ? `${value.slice(0, max - 1)}…` : value)
}
