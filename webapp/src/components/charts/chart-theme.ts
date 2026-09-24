// Shared Recharts props. The design tokens in index.css are hex colours, so
// reference them as `var(--x)` — `hsl(var(--x))` is an invalid colour, which
// SVG paints black and CSS drops (a transparent tooltip).

/** Every <Tooltip>: no slide-in animation, no focus outline, above the legend. */
export const TOOLTIP_BASE = {
  isAnimationActive: false,
  wrapperStyle: { outline: 'none', zIndex: 10 },
} as const

/** Hover band behind the active bar. */
export const BAR_CURSOR = { fill: 'var(--accent)' }

/** Hover guide on line charts. */
export const LINE_CURSOR = { stroke: 'var(--muted-foreground)', strokeDasharray: '3 3' }

/** Seams between pie slices in the card colour (Recharts draws white seams by default). */
export const SLICE_STROKE = 'var(--card)'
