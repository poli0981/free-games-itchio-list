import type { TooltipContentProps, TooltipPayloadEntry } from 'recharts'
import { useFormat } from '@/lib/format'

interface ChartTooltipContentProps extends Partial<Pick<TooltipContentProps, 'active' | 'payload' | 'label'>> {
  /** Sum of all slices of a pie whose slices cover the whole: adds each value's share. */
  total?: number
  /** Formats the heading (the category or x value), e.g. an ISO date. */
  labelFormat?: (label: string) => string
  /** Swatch colour when the entry carries none (the treemap colours its cells itself). */
  colorOf?: (entry: TooltipPayloadEntry) => string | undefined
}

/**
 * Tooltip body for every chart: popover colours from the theme tokens, a swatch
 * per series, and numbers formatted for the chosen language. Pass it as
 * `content={<ChartTooltipContent />}`; Recharts fills in active/payload/label.
 */
export function ChartTooltipContent({ active, payload, label, total, labelFormat, colorOf }: ChartTooltipContentProps) {
  const fmt = useFormat()
  if (!active || !payload?.length) return null
  const heading = label === undefined || label === '' ? '' : labelFormat ? labelFormat(String(label)) : String(label)
  return (
    <div className="min-w-36 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {heading && <p className="mb-1.5 font-medium">{heading}</p>}
      <ul className="space-y-1">
        {payload.map((entry, i) => {
          const value = Number(entry.value)
          const color = colorOf?.(entry) ?? entry.color ?? entry.fill
          return (
            <li key={`${String(entry.name)}-${i}`} className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto pl-4 font-mono font-medium tabular-nums">
                {Number.isFinite(value) ? fmt.number(value) : String(entry.value ?? '')}
                {total && Number.isFinite(value) ? ` (${fmt.percent(value / total)})` : null}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
