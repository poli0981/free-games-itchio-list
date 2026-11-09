// Shared Recharts props. The design tokens in index.css are hex colours, so
// reference them as `var(--x)` — `hsl(var(--x))` is an invalid colour, which
// SVG paints black and CSS drops (a transparent tooltip).
import { createContext } from 'react'

/** Element ids inside one chart card: its heading, description and keyboard hint. */
export function chartIds(id: string) {
  return { title: `chart-${id}-title`, desc: `chart-${id}-desc`, keys: `chart-${id}-keys` }
}

/**
 * Spread on every chart (BarChart, LineChart, PieChart, Treemap). Recharts 3
 * makes the chart a focusable role="application" with an empty <title>; this
 * names it after its card's heading and describes it with the card's
 * description and, for the charts you can step through, the arrow-key hint.
 * (Recharts' own `title` prop would also show a browser tooltip.)
 */
export function chartAria(id: string, { keys = true }: { keys?: boolean } = {}) {
  const ids = chartIds(id)
  return {
    'aria-labelledby': ids.title,
    'aria-describedby': keys ? `${ids.desc} ${ids.keys}` : ids.desc,
  }
}

/**
 * Reads a chart's tooltip out (chart-tooltip.tsx → the card's polite live
 * region): Recharts' own tooltip is a live region, a custom one isn't.
 */
export const ChartAnnounce = createContext<(text: string) => void>(() => {})

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
